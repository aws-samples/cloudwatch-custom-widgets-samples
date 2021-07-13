// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// CloudWatch Custom Widget sample: simple debugger, displays form and parameters passed to widget
const DOCS = `
## Custom Widget Debugger
A simpler "debugger" custom widget that prints out:
* the Lambda **event** oject including the **widgetContext** parameter passed to the widget by CloudWatch Dashboards
* the Lambda **context** object
* the Lambda enivronment variables

### Widget parameters
Just pass in any parameters you want to see how they are sent to the Lambda script.

### Example parameters
\`\`\` yaml
---
param1: value
param2:
- entry1
- entry2
param3:
  sub: 7
\`\`\`
`;

exports.handler = async (event, context) => {
    if (event.describe) {
        return DOCS;   
    }

    const form = event.widgetContext.forms.all;
    const input = form.input || '';
    const stage = form.stage || 'prod';

    return `
        <form>
            <table>
                <tr>
                    <td>Input</td>
                    <td><input name="input" value="${input}"></td>
                    <td>Stage</td>
                    <td><input type="radio" name="stage" id="integ" value="integ" ${stage === 'integ' ? 'checked' : ''}><label for="integ">Integ</label></td>
                    <td><input type="radio" name="stage" id="prod" value="prod" ${stage === 'prod' ? 'checked' : ''}><label for="prod">Prod</label></td>
                    <td>
                        <a class="btn">Popup</a>
                        <cwdb-action action="html" display="popup">
                            <h1>Form values:</h1>
                            <table>
                                <tr><td>Input:</td><td><b>${input}</b></td></tr>
                                <tr><td>Stage:</td><td><b>${stage}</b></td></tr>
                            </table>
                        </cwdb-action>
                    </td>
                    <td>
                        <a class="btn btn-primary">Submit</a>
                        <cwdb-action action="call" endpoint="${context.invokedFunctionArn}"></cwdb-action>
                    </td>
                </tr>
            </table>
        </form>
        <p>
        <h1>event</h1>
        <pre>${JSON.stringify(event, null, 4)}</pre>
        <h1>context</h1>
        <pre>${JSON.stringify(context, null, 4)}</pre>
        <h1>environment variables</h1>
        <pre>${JSON.stringify(process.env, null, 4)}</pre>
    `;
};
