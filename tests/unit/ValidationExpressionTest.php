<?php

namespace Rhubarb\Validation\Tests;

use Codeception\Test\Unit;
use Rhubarb\Validation\ValidationKeyException;
use Rhubarb\Validation\Validations\ValidateNotEmpty;
use Rhubarb\Validation\ValidationTree;
use Rhubarb\Validation\ValidationFailedException;

class ValidationExpressionTest extends Unit
{
    public function testFluent()
    {
        $this->expectException(ValidationKeyException::class);

        $validationExpression = new ValidationTree();
        $validationExpression->notEmpty();
    }

    public function testValidate()
    {
        $validationExpression = new ValidationTree();
        $validationExpression->validate("Forename")->notEmpty();

        $validationExpression->test(function($key){
            return "Bob";
        });

        try {
            $validationExpression->test(function ($key) {
                return "";
            });
            $this->fail("You shouldn't get here");
        } catch(ValidationFailedException $er){
            verify($er->getErrors())->count(1);
            $errors = $er->getErrors();
            verify($errors[0])->isInstanceOf(ValidateNotEmpty::class);
        }

        // Add another validation

        $data = ["Forename" => "Andrew", "Surname" => ""];

        $validationExpression->validate("Surname")->notEmpty();

        try {
            $validationExpression->test(function($key) use ($data){
                return $data[$key];
            });
        } catch(ValidationFailedException $er){
            verify($er->getErrors())->count(1);
            $errors = $er->getErrors();
            verify($errors[0])->isInstanceOf(ValidateNotEmpty::class);
            verify($errors[0]->getKey())->equals("Surname");
        }
    }
}