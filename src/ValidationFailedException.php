<?php

namespace Rhubarb\Validation;

use Throwable;

class ValidationFailedException extends \Exception
{
    protected $errors;

    public function __construct(array $errors)
    {
        parent::__construct("Validation failed");

        $this->errors = $errors;
    }

    /**
     * @return array
     */
    public function getErrors(): array
    {
        return $this->errors;
    }
}