<?php

namespace Rhubarb\Validation\Validations;

use Rhubarb\Validation\ValidationExpression;

class ValidateNotEmpty extends ValidationExpression
{
    public function check($value): bool
    {
        return !empty($value);
    }
}