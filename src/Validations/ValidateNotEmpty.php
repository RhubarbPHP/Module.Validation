<?php

namespace Rhubarb\Validation\Validations;

use Rhubarb\Validation\ValidationExpression;

class ValidateNotEmpty extends ValidationExpression
{
    public function check($value): bool
    {
        return !empty($value);
    }

    protected function getJsInvocationFunction()
    {
        return "window.rhubarb.validation.common.notEmpty";
    }
}