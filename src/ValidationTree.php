<?php
/**
 * Created by PhpStorm.
 * User: acuthbert
 * Date: 05/12/17
 * Time: 09:01
 */

namespace Rhubarb\Validation;


use Rhubarb\Validation\Validations\ValidateNotEmpty;

class ValidationTree implements \JsonSerializable
{
    /**
     * The list of validations in the tree.
     *
     * @var ValidationExpression[]
     */
    private $validations = [];

    /**
     * The validation key to be set on validations created using the
     * fluent pattern.
     *
     * @var string|null
     */
    private $fluentKey = null;

    public function validate(string $key): ValidationTree
    {
        $this->fluentKey = $key;

        return $this;
    }

    public function notEmpty(): ValidationTree
    {
        return $this->custom(new ValidateNotEmpty());
    }

    public function custom(ValidationExpression $expression): ValidationTree
    {
        if (!$this->fluentKey){
            throw new ValidationKeyException();
        }

        $expression->setKey($this->fluentKey);

        $this->validations[] = $expression;

        return $this;
    }

    /**
     * Executes the validation tree against values sourced from the provided callback.
     *
     * @param callable $valueProvidingCallback A callback function that should return data for a given key.
     * @throws ValidationFailedException Thrown if validation was not successful
     */
    public function test(callable $valueProvidingCallback)
    {
        foreach($this->validations as $validation){
            if (!$validation->check($valueProvidingCallback($validation->getKey()))){
                throw new ValidationFailedException([
                    $validation
                ]);
            }
        }
    }

    /**
     * Checks the validation tree against values sourced from the provided callback and returns true or false.
     *
     * @param callable $valueProvidingCallback A callback function that should return data for a given key.
     * @return bool
     */
    public function check(callable $valueProvidingCallback): bool
    {
        try {
            $this->test($valueProvidingCallback);
            return true;
        } catch (ValidationFailedException $er){
            return false;
        }
    }

    /**
     * Requires the key to have a value.
     *
     * Shorthand for ->validate($key)->notEmpty();
     *
     * @param string $key The key to test
     * @return ValidationTree
     */
    public function require(string $key): ValidationTree
    {
        return $this->validate($key)->notEmpty();
    }

    public final function asJavascriptObject()
    {
        $list = [];

        foreach($this->validations as $validation){
            $item = new \stdClass();
            $item->function = $validation->getJsInvocation();
            $item->key = $validation->getKey();

            $list[] = $item;
        }

        return $list;
    }

    public function jsonSerialize()
    {
        return $this->asJavascriptObject();
    }
}