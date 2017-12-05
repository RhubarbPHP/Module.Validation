<?php

namespace Rhubarb\Validation\Tests;

use Codeception\Test\Unit;
use Rhubarb\Validation\ValidationKeyException;
use Rhubarb\Validation\Validations\ValidateNotEmpty;
use Rhubarb\Validation\ValidationTree;
use Rhubarb\Validation\ValidationFailedException;

class ValidationTreeTest extends Unit
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

    public function testCheck()
    {
        $validationExpression = new ValidationTree();
        $validationExpression->validate("Forename")->notEmpty();

        $result = $validationExpression->check(function($key){
            return "Bob";
        });

        verify($result)->true();

        $result = $validationExpression->check(function($key){
            return "";
        });

        verify($result)->false();
    }

    public function testRequire()
    {
        $validationExpression = new ValidationTree();
        $expression = $validationExpression->require("Forename");

        verify($expression)->same($validationExpression);

        $result = $validationExpression->check(function($key){
            return "Bob";
        });

        verify($result)->true();

        $result = $validationExpression->check(function($key){
            return "";
        });

        verify($result)->false();
    }

    public function testJavascriptReflection()
    {
        $validationExpression = new ValidationTree();
        $validationExpression
            ->require("Forename")
            ->require("Surname");

        $jsTree = $validationExpression->asJavascriptObject();

        verify($jsTree)->count(2);
        verify($jsTree[0]->function)->equals("window.rhubarb.validation.common.notEmpty");
        verify($jsTree[0]->key)->equals("Forename");
    }
}