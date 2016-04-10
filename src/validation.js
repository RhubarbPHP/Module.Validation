
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

window.rhubarb.validation.states = {
    "notTested": 0,
    'valid': 1,
    'checking': 2,
    'invalid': 3
};

window.rhubarb.validation.validator = function(){

    this._checks = [];
    this._sources = [];
    this._targetElement = false;

    this.state = window.rhubarb.validation.states.nottested;
    this.errorMessages = [];

    var self = this;

    this.check = function(callback){
        this._checks.push(callback);
    };

    this.source = function(source){
        self._sources.push(source);
        source.triggerValidation = function(value){
            self.validate(value);
        };
    };

    this.setTargetElement = function(targetElement){
        self._targetElement = targetElement;
    };

    this.validate = function(value){
        for(var i = 0; i < self._checks.length; i++){
            var check = self._checks[i];

            // Update our status to checking (this might be used for slow validations)
            self.state = window.rhubarb.validations.states.checking;

            // Reset our error messages in case this is a second attempt
            self.errorMessages = [];

            try {
                check(value);
            } catch(error){
                // The validation failed - an Error exception should have been thrown.
                self.errorMessages.push(error.message);
            }
        }

        self.updateClasses();
    };

    this.updateClasses = function(){
        if (!self._targetElement){
            // If we don't have a target element we can't update any CSS classes.
            return;
        }

        var classes = [];

        switch(self.state){
            case window.rhubarb.validations.states.valid:
                classes.push("is-valid");
                break;
            case window.rhubarb.validations.states.checking:
                classes.push("is-checking");
                break;
            case window.rhubarb.validations.states.invalid:
                classes.push("is-invalid");
                break;
            case window.rhubarb.validations.states.notTested:
                classes.push("not-tested");
                break;
        }

        self._targetElement.classList.remove("is-valid", "is-checking", "is-invalid", "not-tested");
        self._targetElement.classList.add(classes);

        // Try and find an error container and update the message with our error messages.
        var errorMessage = self._targetElement.querySelector(".error-message");

        if (errorMessage){
            errorMessage.innerHTML = "<p>" + self.errorMessages.join("<br/>") + "</p>";
        }
    }
};

windows.rhubarb.validation.sources.fromTextBox = function(textBoxElement){
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
  return function (value){
      var compareTo = (orEqual) ? greaterThan - 1 : greaterThan;
      if (value.length > greaterThan){
          throw new Error("The length must less than " + (orEqual ? " (or equal to) " : "" ) + greaterThan);
      }
  };
};

window.rhubarb.validation.standardValidations.isEmailAddress = function(){
    return function(value){
        if (value.indexOf("@") == -1){
            throw new Error("Email addresses must contain a '@' character");
        }
    }
};

window.rhubarb.validation.standardValidations.allValid = function(validations) {
    return function () {
        var errors = [];

        for (var i = 0; i < validations.length; i++) {
            var validation = validations[i];

            if (validation.state != window.rhubarb.validation.states.valid) {
                errors.push(validation.errorMessages);
            }
        }

        if (errors.length > 0) {
            throw new Error()
        }
    };
};