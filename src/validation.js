
// Ensure the global scope objects are created if they don't already exist.
if (!window.rhubarb){
    window.rhubarb = {};
}

if (!window.rhubarb.validation){
    window.rhubarb.validation = {};
}

if (!window.rhubarb.validation.common){
    window.rhubarb.validation.common = {};
}

if (!window.rhubarb.validation.sources){
    window.rhubarb.validation.sources = {};
}

if (!window.rhubarb.validation.triggers){
    window.rhubarb.validation.triggers = {};
}

if (!window.validation){
    // Provide a quick global alias to validation if that is possible
    window.validation = window.rhubarb.validation;
}

window.rhubarb.validation.states = {
    "notTested": 0,
    'valid': 1,
    'checking': 2,
    'invalid': 3
};

window.rhubarb.validation.validator = function(){

    this._checks = [];
    this._triggers = [];
    this._source = false;
    this._targetElement = false;
    this._isRequired = false;
    this._hasValue = false;
    this._messageFormatter = function (errors) {
        return "<p>" + errors.join(". ") + "</p>";
    };

    this.requiredMessage = "A value is required here.";
    this.state = window.rhubarb.validation.states.nottested;
    this.errorMessages = [];

    var self = this;

    this.require = function(message){
        self._isRequired = true;

        if (message){
            self.requiredMessage = message;
        }

        return self;
    };

    this.check = function(callback){
        self._checks.push(callback);

        return self;
    };

    this.setMessageFormatter = function(formatterCallback){
        self._messageFormatter = formatterCallback;
    };

    this.addTrigger = function(broker){

        // Try and upscale any strings passed to an HTML element
        try {
            broker = this.makeHtmlElement(broker);
        } catch (error) {
            throw new Error("A string '" + broker + "' passed to addTrigger was not a valid HTML Element ID.");
        }

        if (broker instanceof HTMLElement){
            broker = window.rhubarb.validation.triggers.onHtmlElementValueChanged(broker);
        }

        self._triggers.push(broker);

        broker.trigger = function(value){
            self.validate();
        };

        return self;
    };

    this.setSource = function(source){
        try {
            self._source = this.makeHtmlElementValueCallback(source);
        } catch (error){
            if (error.message == "string" ){
                throw new Error("A string '" + source + "' passed to setSource was not a valid HTML Element ID." );
            } else {
                throw new Error("An element passed to setSource was not a valid HTML input element." );
            }
        }

        return self;
    };

    this.makeHtmlElement = function(nameOrElement){
        if (typeof nameOrElement == "string"){
            nameOrElement = document.getElementById(nameOrElement);

            if (!nameOrElement){
                throw new Error(nameOrElement + " is not an HTML element" );
            }
        }

        return nameOrElement;
    };

    this.makeHtmlElementValueCallback = function(elementOrCallback){

        try {
            elementOrCallback = this.makeHtmlElement(elementOrCallback);
        } catch(error){
            throw new Error("string");
        }

        if (elementOrCallback instanceof HTMLElement){
            if ( typeof elementOrCallback.value == undefined ) {
                throw new Error("element");
            }

            var element = elementOrCallback;
            elementOrCallback = function () {
                return element.value;
            };
        }

        return elementOrCallback;
    };

    this.setTargetElement = function(targetElement){

        // Try and upscale any strings passed to an HTML element
        try {
            targetElement = this.makeHtmlElement(targetElement);
        } catch (error) {
            throw new Error("A string '" + targetElement + "' passed to setTargetElement was not a valid HTML Element ID.");
        }

        self._targetElement = targetElement;

        return self;
    };

    this.checkHasValue = function (value) {
        if (value == "0") {
            value = false;
        }

        self._hasValue = !!value;
    };

    this.validate = function(successCallback, failureCallback){

        var value = (self._source) ? self._source() : false;

        self.checkHasValue(value);

        // Update our status to checking (this might be used for slow validations)
        self.state = window.rhubarb.validation.states.checking;
        self.updateClasses();

        // Reset our error messages in case this is a second attempt
        self.errorMessages = [];

        var validationCompleted = function() {

            for (var i = 0; i < self._checks.length; i++) {
                var check = self._checks[i];
                if (!check.checked){
                    // Not all the checks are complete - a later callback will come back here
                    // when that happens. For now we can't update the status yet.
                    return;
                }
            }

            if (self._isRequired && !self._hasValue){
                self.errorMessages.push(self.requiredMessage);
            }

            if (self.errorMessages.length > 0){
                self.state = window.rhubarb.validation.states.invalid;
                self.updateClasses();

                if (failureCallback){
                    failureCallback(self.errorMessages);
                }
            } else {
                self.state = window.rhubarb.validation.states.valid;
                self.updateClasses();

                if (successCallback){
                    successCallback();
                }
            }
        };

        if ( self._checks.length > 0 ) {
            // Do the checks only if we have checks to do
            for (var i = 0; i < self._checks.length; i++) {
                var check = self._checks[i];
                check.checked = false;

                check(
                    value,
                    function () {
                        // On success
                        this.checked = true;
                        validationCompleted();
                    }.bind(check),
                    function (error) {
                        // The validation failed - an Error exception should have been thrown.
                        this.checked = true;
                        if (Array.isArray(error)) {
                            for (var m = 0; m < error.length; m++) {
                                self.errorMessages.push(error[m]);
                            }
                        } else {
                            self.errorMessages.push(error);
                        }
                        validationCompleted();
                    }.bind(check)
                );
            }
        } else {
            // Otherwise just evaluation completion (essentially allowing for required status only)
            validationCompleted();
        }

        return self.state == window.rhubarb.validation.states.valid;
    };

    this.updateClasses = function(){
        if (!self._targetElement){
            // If we don't have a target element we can't update any CSS classes.
            return;
        }

        self._targetElement.classList.remove("is-valid", "is-checking", "is-invalid", "is-not-tested", "is-required", "is-missing");

        switch(self.state){
            case window.rhubarb.validation.states.valid:
                self._targetElement.classList.add("is-valid");
                break;
            case window.rhubarb.validation.states.checking:
                self._targetElement.classList.add("is-checking");
                break;
            case window.rhubarb.validation.states.invalid:
                self._targetElement.classList.add("is-invalid");
                break;
            case window.rhubarb.validation.states.notTested:
                self._targetElement.classList.add("is-not-tested");
                break;
        }

        if (self._isRequired){
            self._targetElement.classList.add("is-required");

            if (!self._hasValue){
                self._targetElement.classList.add("is-missing");
            }
        }

        // Try and find an error container and update the message with our error messages.
        var errorMessage = self._targetElement.querySelector(".js-validation-message");

        if (errorMessage){
            if( self.errorMessages.length > 0){
                errorMessage.innerHTML = self._messageFormatter(self.errorMessages);
            } else {
                errorMessage.innerHTML = "";
            }
        }
    }
};

window.rhubarb.validation.sources.fromHtmlElement = function(htmlElement){
    return function(){
        return htmlElement.value;
    };
};

window.rhubarb.validation.triggers.onHtmlElementValueChanged = function(htmlElement){
    var broker = {};
    broker.trigger = function(){};

    htmlElement.addEventListener('change', function(){
        broker.trigger();
    });

    return broker;
};

// Define our standard validation routines. You can of course create your own. The validation framework requires
// a callback for each validation routine. Our pattern here is to define a function that **returns a callback**.
// This allows our outer function to define arguments that are then presented to the programmer in any good IDE.
window.rhubarb.validation.common.lengthGreaterThan = function(greaterThan, orEqual){
  return function (value, successCallback, failedCallback){
      var compareTo = (orEqual) ? greaterThan - 1 : greaterThan;
      if (value.length > greaterThan){
          failedCallback("The length must less than " + (orEqual ? " (or equal to) " : "" ) + greaterThan);
          return;
      }

      successCallback();
  };
};

window.rhubarb.validation.common.regex = function(regex, failureMessage){
    return function(value, successCallback, failedCallback){
        if (!value.match(regex)){
            failedCallback(failureMessage);
            return;
        }

        successCallback();
    }
};

window.rhubarb.validation.common.isEmailAddress = function(){
    return function(value, successCallback, failedCallback){
        if (value.indexOf("@") == -1){
            failedCallback("Email addresses must contain a '@' character");
            return;
        }

        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!re.test(value)){
            failedCallback(value + " does not look like an email address");
            return;
        }

        successCallback();
    }
};

window.rhubarb.validation.common.matches = function(matchSourceCallback){
  return function(value, successCallback, failedCallback){
      var compareTo = matchSourceCallback();

      if (compareTo != value){
          failedCallback("The values must match");
          return;
      }

      successCallback();
  };
};

window.rhubarb.validation.common.allValid = function(validations) {
    return function (value, successCallback, failedCallback) {
        var errors = [];
        var validationsToCheck = validations;

        for (var i = 0; i < validationsToCheck.length; i++) {
            var validationToCheck = validationsToCheck[i];

            validationToCheck.validate(
                function () {
                },
                function (errorMessages) {
                    for (var m = 0; m < errorMessages.length; m++) {
                        errors.push(errorMessages[m]);
                    }
                }.bind(validationToCheck)
            );
        }

        var checkAll = function () {
            for (var i = 0; i < validationsToCheck.length; i++) {
                var validationToCheckOn = validationsToCheck[i];
                if (validationToCheckOn.state == window.rhubarb.validation.states.checking) {
                    setTimeout(checkAll, 200);
                    return;
                }
            }

            if (errors.length > 1) {
                failedCallback(errors);
                return;
            }

            if (errors.length > 0) {
                failedCallback(errors);
                return;
            }

            successCallback();
        };

        checkAll();
    };
};
