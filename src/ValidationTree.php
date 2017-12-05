<?php
/**
 * Created by PhpStorm.
 * User: acuthbert
 * Date: 05/12/17
 * Time: 09:01
 */

namespace Rhubarb\Validation;


use Rhubarb\Validation\Validations\ValidateNotEmpty;

class ValidationTree
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
     * Executes the validation expression against values sourced from the provided callback.
     *
     * @param callable $valueProvidingCallback
     * @throws ValidationFailedException
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
}