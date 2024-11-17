# A registry of all assumptions made in this software.

Include any assumptions that might have significant impact on logic or architecture, as we wish to preserve context around the decisions related to these assumptions. Each assumption should be listed with its consequences in a table.

| Assumption | Consequences |
|---|---|
| End users will likely be scripting using JavaScript, not TypeScript | - We should provide thorough typechecking with clear error messages |
| The main use case for this software is generating input to Sibelius/MuseScore | - We do not need to support streaming data<br>- We do not need to support that which is not supported in these programs |
