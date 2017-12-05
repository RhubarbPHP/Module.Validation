<?php

namespace Rhubarb\Validation;

abstract class ValidationExpression
{
    /**
     * @var string
     */
    private $key;

    public abstract function check($value): bool;

    /**
     * Gets the key
     *
     * @return string
     */
    public final function getKey(): string
    {
        return $this->key;
    }

    /**
     * Sets the key
     *
     * @param string $key
     */
    public final function setKey(string $key)
    {
        $this->key = $key;
    }

    public final function getJsInvocation()
    {
        return $this->getJsInvocationFunction();
    }

    protected abstract function getJsInvocationFunction();
}