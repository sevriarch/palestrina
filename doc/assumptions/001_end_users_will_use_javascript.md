# End Users are expected to use JavaScript

## Context

If end users were to use TypeScript to use this library, many validation cases could be skipped.

## Assumption

End users for this software should not be assumed to be professional developers. Hence it is much more likely that they will use JavaScript rather than TypeScript.

## Implications

Thorough typechecking is required at all points in the software that may touch unsanitised user input.