# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

# CloudWatch Custom Widget sample: simple debugger, displays form and parameters passed to widget
import json
import os

DOCS = """
## Custom Widget Debugger
A simpler "debugger" custom widget that prints out:
* the Lambda **event** oject including the **widgetContext** parameter passed to the widget by CloudWatch Dashboards
* the Lambda **context** object
* the Lambda enivronment variables

### Widget parameters
Just pass in any parameters you want to see how they are sent to the Lambda script.

### Example parameters
``` yaml
---
param1: value
param2:
- entry1
- entry2
param3:
  sub: 7
```"""

def lambda_handler(event, context):
    if 'describe' in event:
        return DOCS 

    form = event['widgetContext']['forms']['all']
    input = form.get('input', '')
    stage = form.get('stage', 'prod')
    prettyEvent = json.dumps(event, indent=4, sort_keys=True)
    prettyContext = json.dumps(context.__dict__, indent=4, sort_keys=True, default=str)
    prettyEnv = ""
    for key, val in os.environ.items():
        prettyEnv += f"{key}={val}\n"

    return f"""
        <form>
            <table>
                <tr>
                    <td>Input</td>
                    <td><input name="input" value="{input}"></td>
                    <td>Stage</td>
                    <td><input type="radio" name="stage" id="integ" value="integ" {"checked" if stage == "integ" else ""}><label for="integ">Integ</label></td>
                    <td><input type="radio" name="stage" id="prod" value="prod" {"checked" if stage == "prod" else ""}><label for="prod">Prod</label></td>
                    <td>
                        <a class="btn">Popup</a>
                        <cwdb-action action="html" display="popup">
                            <h1>Form values:</h1>
                            <table>
                                <tr><td>Input:</td><td><b>{input}</b></td></tr>
                                <tr><td>Stage:</td><td><b>{stage}</b></td></tr>
                            </table>
                        </cwdb-action>
                    </td>
                    <td>
                        <a class="btn btn-primary">Submit</a>
                        <cwdb-action action="call" endpoint="{context.invoked_function_arn}"></cwdb-action>
                    </td>
                </tr>
            </table>
        </form>
        <p>
        <h1>event</h1>
        <pre>{prettyEvent}</pre>
        <h1>context</h1>
        <pre>{prettyContext}</pre>
        <h1>Lambda environment variables</h1>
        <pre>{prettyEnv}</pre>
    """
