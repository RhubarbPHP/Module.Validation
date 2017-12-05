<?php

namespace Rhubarb\Validation;

class ValidationKeyException extends \Exception
{
    public function __construct()
    {
        parent::__construct("No `key` was set. Call validate() before calling fluent validation methods");
    }
}