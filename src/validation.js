
// Ensure the global scope objects are created if they don't already exist.
if (!window.rhubarb){
    window.rhubarb = {};
}

if (!window.rhubarb.validation){
    window.rhubarb.validation = {};
}

if (!window.rhubarb.validation.standardValidations){
    window.rhubarb.validation.standardValidations = {};
}

if (!window.rhubarb.validation.sources){
    window.rhubarb.validation.sources = {};
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
    this._source = false;
    this._targetElement = false;
    this._isRequired = false;
    this._hasValue = false;

    this.requiredMessage = "A value is required here.";
    this.state = window.rhubarb.validation.states.nottested;
    this.errorMessages = [];

    var self = this;

    this.require = function(){
        self._isRequired = true;

        return self;
    };

    this.check = function(callback){
        self._checks.push(callback);

        return self;
    };

    this.setSource = function(source){
        self._source = source;
        source.triggerValidation = function(value){
            self.validate();
        };

        return self;
    };

    this.setTargetElement = function(targetElement){
        self._targetElement = targetElement;

        return self;
    };

    this.validate = function(successCallback, failureCallback){

        var value = (self._source) ? self._source.getValue() : false;

        self._hasValue = !!value;

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
                        self.errorMessages.push(error);
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
            errorMessage.innerHTML = "<p>" + self.errorMessages.join("<br/>") + "</p>";
        }
    }
};

window.rhubarb.validation.sources.fromTextBox = function(textBoxElement){
    var self = this;

    this.triggerValidation = function(){};
    this.getValue = function(){
        return textBoxElement.value;
    };

    textBoxElement.addEventListener('change', function(){
       self.triggerValidation(self.getValue());
    });
};

// Define our standard validation routines. You can of course create your own. The validation framework requires
// a callback for each validation routine. Our pattern here is to define a function that **returns a callback**.
// This allows our outer function to define arguments that are then presented to the programmer in any good IDE.
window.rhubarb.validation.standardValidations.lengthGreaterThan = function(greaterThan, orEqual){
  return function (value, successCallback, failedCallback){
      var compareTo = (orEqual) ? greaterThan - 1 : greaterThan;
      if (value.length > greaterThan){
          failedCallback("The length must less than " + (orEqual ? " (or equal to) " : "" ) + greaterThan);
      }

      successCallback();
  };
};

window.rhubarb.validation.standardValidations.isEmailAddress = function(){
    return function(value, successCallback, failedCallback){
        if (value.indexOf("@") == -1){
            failedCallback("Email addresses must contain a '@' character");
        }

        successCallback();
    }
};

window.rhubarb.validation.standardValidations.allValid = function(validations) {
    return function (value, successCallback, failedCallback) {
        var errors = [];
        var validationsToCheck = validations;

        var checkAll = function() {

            for (var i = 0; i < validationsToCheck.length; i++) {
                var validationToCheck = validationsToCheck[i];

                if (validationToCheck.state != window.rhubarb.validation.states.checking) {
                    validationToCheck.validate(function(){
                    }.bind(validationToCheck), function(errorMessages){
                        errors.push(errorMessages);
                    }.bind(validationToCheck));
                }
            }

            for (var j = 0; i < validationsToCheck.length; i++) {
                var validationToCheckOn = validationsToCheck[i];
                if (validationToCheckOn.state == window.rhubarb.validation.states.checking){
                    setTimeout(checkAll, 200);
                    return;
                }
            }

            if (errors.length > 1) {
                failedCallback("Sorry, multiple errors exist on this form.");
                return;
            }

            if (errors.length > 0) {
                failedCallback("Sorry, there is an error on this form.");
                return;
            }

            successCallback();
        };

        checkAll();
    };
};