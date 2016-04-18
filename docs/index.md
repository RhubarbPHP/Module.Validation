Javascript Validation
===

The validation of forms is a necessary step in protecting your application for misuse. It's often a delicate
and sometimes tedius task. This module provides a pattern for implementing validation of form data which is
hopefully flexible enough to facilitate any validation design while being straight forward and easy to setup.

We consider validation as having two subtly different goals:

1. To validate the content and format of single values
2. To validate the overall state of a submission meets a required specification

## Including the library

The main validation routine exists in the `src/validation.js` file. As the module will be loaded using composer
it's full path will be `vendor/rhubarbphp/module.jsvalidation/src/validation.js`. To load this file in Rhubarb
it needs deployed and registered with the `ResourceLoader`:

``` php
$validationPath = VENDOR_DIR."/rhubarbphp/module.jsvalidation/src/validation.js";
$provider = ResourceDeploymentProvider::getResourceDeploymentProvider();
ResourceLoader::loadResource($provider->deployResource($validationPath);
```

You should include code like this in the generating class for the response creating the HTML for your page.

The library sets up collections of classes and functions under the global window scope:

``` javascript
// An object containing common validation checks
window.rhurbarb.validation.common

// An object listing common validation data source mappers
window.rhurbarb.validation.sources

// An object listing common trigger brokers
window.rhurbarb.validation.triggers

// The validator object that collects checks together and runs them against the source.
window.rhurbarb.validation.validator
```

If `window.validation` isn't already in use this will become an alias to window.rhubarb.validation to make
code a little more readable:

``` javascript
// As window is the default global scope we can just drop it too:
validation.common
validation.sources
validation.triggers
validation.validator
```

## The validator object - validating content

To setup some validation instantiate the validator object and then give it a source:

``` javascript
var emailValidation = new validation.validator();
emailValidation.check(validation.common.isEmailAddress());
```

### Setting a source

You should also tell it how to source the value to feed the input. This should be a function, very often a
closure or a reference to one of the common feeds.

``` javascript
var emailValidation = new validation.validator();
emailValidation
    .check(validation.common.isEmailAddress())
    .setSource(validation.sources.fromHtmlInput(document.getElementById('Email')));
```

In this example `fromTextElement` is a ready made function that when called returns a callback which can
return the value property of an HTML input element.

Also note that the library follows a (https://en.wikipedia.org/wiki/Fluent_interface)[fluent pattern] letting
calls be chained to improve readability.

### Adding a trigger

Triggers signal that a particular validator should validate it's value. The most common trigger is one that
fires when an input value has changed. A more complex trigger might fire when any one of a range of inputs changes.

``` javascript
var emailValidation = new validation.validator();
emailValidation
    .check(validation.common.isEmailAddress())
    .setSource(validation.sources.fromHtmlInput(document.getElementById('Email')))
    .addTrigger(validation.triggers.fromHtmlInput(document.getElementById('Email')));
```

The `addTrigger` method expects a simple broker object that can broker the HTML events and call a a `trigger` method.
Our validator will replace with the trigger method with one that triggers the validation. In this example
we're generating that broker object by calling a standard trigger generator for html inputs.

Unlike `setSource` you can call `addTrigger` any number of times to setup additional triggers.

Running validation in response to a button push is not normally considered a trigger. See the section below on
evaluating a whole form.

### Updating HTML and CSS

Once validation has considered the value and made its judgement it's normal practice to target an HTML element
and set some CSS classes which can control the visual state of the input. For example highlighting when the input
contains invalid data or is required but missing.

We need to give our validator a reference to the HTML element (usually a <div> element) we want updated.

``` javascript
var emailValidation = new validation.validator();
emailValidation
    .check(validation.common.isEmailAddress())
    .setSource(validation.sources.fromHtmlInput(document.getElementById('Email')))
    .addTrigger(validation.triggers.onHtmlInputChanged(document.getElementById('Email')))
    .setTargetElement(document.getElementById('email-validation'));
```

The HTML for this example might look like:

``` html
<div id="email-validation">
    <label for="Email">Email Address</label>
    <input type="text" name="Email" />
    <span class="js-validation-message"></span>
</div>
```

The special element with the class of `js-validation-message` is targeted when the validation fails and an
error message is injected into it. This is optional and sometimes not appropriate (for example if the form is
very small like a login form).

/// TODO: list classes

### Keeping it simple

Passing callbacks to the validator functions like `setSource` and `addTrigger` allows for infinite flexibility.
The common source and trigger collections make this a little easier to use. However as the most common ways of
using the validation system are so common the validator function calls can be simplified. Both `setSource` and
`addTrigger` can recognise an HTML input being passed to it so our example can be simplified to:

``` javascript
var emailValidation = new validation.validator();
emailValidation
    .check(validation.common.isEmailAddress())
    .setSource(document.getElementById('Email'))
    .addTrigger(document.getElementById('Email'))
    .setTargetElement(document.getElementById('email-validation'));
```

`setSource`, `addTrigger` and `setTarget` all recognise strings as potential document elements and so we
can take this one stage further:

``` javascript
var emailValidation = new validation.validator();
emailValidation
    .check(validation.common.isEmailAddress())
    .setSource('Email')
    .addTrigger('Email')
    .setTargetElement('email-validation');
```

This will not work for every scenario but if you can use these shortcuts it will make the code more readable.

> Don't forget - `setSource` and `addTrigger` can be given a custom callbacks or broker objects to allow
> infinitely complex behaviours.

### A more complex example

Let's look at another very common validation requirement - checking a password confirmation input matches the
first password entry input. This is a good example of validation that isn't correlated with a single input.

``` javascript
var passwordValidation = new validation.validator();
passwordValidation
    .check(validation.common.lengthGreaterThan(8, true))
    .check(validation.common.matches(document.getElementById('PasswordConfirm')))
    .setSource('Password')
    .addTrigger('Password')
    .addTrigger('PasswordConfirm')
    .setTargetElement('password-validation');
```

``` html
<div id="password-validation">
    <div>
        <label for="Password">Password</label>
        <input type="password" name="Password" />
    </div>
    <div>
        <label for="PasswordConfirm">ConfirmPassword</label>
        <input type="password" name="PasswordConfirm" />
    </div>

    <span class="js-validation-message"></span>
</div>
```

Note that we've applied two different checks to the validator and set two different triggers. In the HTML we've got
a single validation container and message element to surround both inputs.

Here the `matches` validation check is being passed just the HTML element to compare the value with. However it
can be given a callback function that can calculate the comparison value any way it likes. Unlike other shortcuts
you can't pass a string - strings are taken as fixed values and used directly in the comparison.

## Validating forms - submission validation

When the user presses the submit button on your form we must stop the browser from posting the submission if
the user data fails to meet the required specification. This specification can viewed as a list of values which
must be supplied, correctly, in order for the overall submission to be valid.

### Required values

In the password example above, we have left a big loophole - if we leave the password box empty the validator
won't even try to run the checks. Let's close that now:

``` javascript
var passwordValidation = new validation.validator();
passwordValidation
    .require()
    .check(validation.common.lengthGreaterThan(8, true))
    .check(validation.common.matches(document.getElementById('PasswordConfirm')))
    .setSource('Password')
    .addTrigger('Password')
    .addTrigger('PasswordConfirm')
    .setTargetElement('password-validation');
```

Notice the call to `require()`? Normally validations won't consult the checks if the source reports no value.
`require` simply indicates to the validation that a value is required and if the source can't give it a value
the validator has failed.
