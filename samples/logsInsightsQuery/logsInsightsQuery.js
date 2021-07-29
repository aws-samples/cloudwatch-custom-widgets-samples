// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// CloudWatch Custom Widget sample: display results of Athena queries
const aws = require('aws-sdk')

const CHECK_QUERY_STATUS_DELAY_MS = 250;
const CSS = '<style>td { white-space: nowrap; }</style>'
const ORIGINAL_QUERY = 'fields @timestamp, @message | sort @timestamp desc | limit 20';

const DOCS = `
## Run Logs Insights Query
Runs a Logs Insights query and displays results in a table.

### Widget parameters
Param | Description
---|---
**logGroups** | The log groups (comma-separated) to run query against
**query** | The query to run
**region** | The region to run the query in

### Example parameters
\`\`\` yaml
logGroups: ${process.env.AWS_LAMBDA_LOG_GROUP_NAME}
query: '${ORIGINAL_QUERY}'
region: ${process.env.AWS_REGION}
\`\`\`
`;

const runQuery = async (logsClient, logGroups, queryString, startTime, endTime) => {
    const startQuery = await logsClient.startQuery({
            logGroupNames: logGroups.replace(/\s/g, '').split(','),
            queryString,
            startTime,
            endTime
        }).promise();
    const queryId = startQuery.queryId;

    while (true) {
        const queryResults = await logsClient.getQueryResults({ queryId }).promise();
        if (queryResults.status !== 'Complete') {
            await sleep(CHECK_QUERY_STATUS_DELAY_MS);     // Sleep before calling again
        } else {
            return queryResults.results;
        }
    }
};

const sleep = async (delay) => {
    return new Promise((resolve) => setTimeout(resolve, delay));
};

const displayResults = async (logGroups, query, results, context) => {
    let html = `
        <form><table>
            <tr>
                <td>Log Groups</td><td><input name="logGroups" value="${logGroups}" size="100"></td>
            </tr><tr>
                <td valign=top>Query</td><td><textarea name="query" rows="2" cols="80">${query}</textarea></td>
            </tr>
        </table></form>
        <a class="btn btn-primary">Run query</a>
        <cwdb-action action="call" endpoint="${context.invokedFunctionArn}"></cwdb-action>
        <a class="btn">Reset to original query</a>
        <cwdb-action action="call" endpoint="${context.invokedFunctionArn}">
            { "resetQuery": true }
        </cwdb-action>
        <p>
        <h2>Results</h2>
    `;
    const stripPtr = result => result.filter(entry => entry.field !== '@ptr');

    if (results && results.length > 0) {
        const cols = stripPtr(results[0]).map(entry => entry.field);
        
        html += `<table><thead><tr><th>${cols.join('</th><th>')}</th></tr></thead><tbody>`;
  
        results.forEach(row => {
            const vals = stripPtr(row).map(entry => entry.value);
            html += `<tr><td>${vals.join('</td><td>')}</td></tr>`;
        });
  
        html += `</tbody></table>`
    } else {
        html += `<pre>${JSON.stringify(results, null, 4)}</pre>`;
    }
    
    return html;
};

exports.handler = async (event, context) => {
    if (event.describe) {
        return DOCS;   
    }

    const widgetContext = event.widgetContext;
    const form = widgetContext.forms.all;
    const logGroups = form.logGroups || event.logGroups;
    const region = widgetContext.params.region || event.region || process.env.AWS_REGION;
    const timeRange = widgetContext.timeRange.zoom || widgetContext.timeRange;
    const logsClient = new aws.CloudWatchLogs({ region });
    const resetQuery = event.resetQuery;
    
    let query = form.query || event.query;
    if (resetQuery) {
        query = widgetContext.params.query || ORIGINAL_QUERY;
    }

    let results;

    if (query && query.trim() !== '') {
        try {
            results = await runQuery(logsClient, logGroups, query, timeRange.start, timeRange.end);
        } catch (e) {
            results = e;
        }
    }

    return CSS + await displayResults(logGroups, query, results, context);
};
