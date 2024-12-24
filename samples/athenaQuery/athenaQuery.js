// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// CloudWatch Custom Widget sample: display results of Athena queries
const { AthenaClient, StartQueryExecutionCommand, GetQueryExecutionCommand, GetQueryResultsCommand } = require("@aws-sdk/client-athena");

const DOCS = `
## Run Athena Query
Runs an Athena query and displays results in a table.

### Widget parameters
Param | Description
---|---
**region** | The region to run the Athena query in
**database** | Name of the Athena database
**sql** | The SQL query to run

### Example parameters
\`\`\` yaml
region: ${process.env.AWS_REGION}
database: default
sql: select eventtime, eventsource, eventname from sampledb.cloudtrail_logs limit 10
\`\`\`
`;

const CHECK_QUERY_STATUS_DELAY_MS = 250;
const CSS = '<style>td { white-space: nowrap; }</style>'

const executeQuery = async (athena, accountId, region, querySQL, database)  => {
    const params = {
        QueryString: querySQL,
        ResultConfiguration: {
            OutputLocation: `s3://aws-cw-widget-athena-query-results-${accountId}-${region}`
        },
        QueryExecutionContext: {
            Database: database
        }
    };

    const startQueryCommand = new StartQueryExecutionCommand(params);
    const query = await athena.send(startQueryCommand);

    // Wait until query is finished execution.
    await checkQueryStatus(athena, query);
    const getQueryResultsCommand = new GetQueryResultsCommand({ QueryExecutionId: query.QueryExecutionId });
    return await athena.send(getQueryResultsCommand);
}

const checkQueryStatus = async (athena, query) => {
    let finished = false;
    while (!finished) {
        await sleep(CHECK_QUERY_STATUS_DELAY_MS);

        const getQueryExecutionCommand = new GetQueryExecutionCommand(query);
        const response = await athena.send(getQueryExecutionCommand);
        const queryStatus = response.QueryExecution.Status.State;
        switch (queryStatus) {
            case 'SUCCEEDED':
                finished = true;
            case 'RUNNING':
            case 'QUEUED':
                continue;
            default:
                console.error('Query Error: ', response);
                throw new Error(`Status of Query ${query.QueryExecutionId} is ${queryStatus}.`);
        }
    }
}

const sleep = async (delay) => {
    return new Promise((resolve) => setTimeout(resolve, delay));
}

const displayResults = async (database, sql, results, region, context) => {
    let html = `
        <form><table>
            <tr>
                <td>Database</td><td><input name="database" value="${database}"></td>
            </tr><tr>
                <td valign=top>SQL</td><td><textarea name="sql" rows="2" cols="80">${sql}</textarea></td>
            </tr>
        </table></form>
        <a class="btn btn-primary">Run query</a>
        <cwdb-action action="call" endpoint="${context.invokedFunctionArn}">{ "region": "${region}" }</cwdb-action>
        <p>
        <h2>Results</h2>
    `;

    if (results && results.ResultSet && results.ResultSet.ResultSetMetadata) {
        const cols = results.ResultSet.ResultSetMetadata.ColumnInfo;
        const rows = results.ResultSet.Rows.slice(1);

        html += `
            <table><thead><tr><th>${cols.map(col => col.Label).join('</th><th>')}</th></tr></thead><tbody>`;

        rows.forEach(row => {
            html += `<tr><td>${row.Data.map(cell => cell.VarCharValue || '').join('</td><td>')}</td></tr>`;
        });

        html += `</tbody></table>`
    } else if (results) {
        html += `<pre>${results}</pre>`;
    }

    return html;
};

exports.handler = async (event, context) => {
    if (event.describe) {
        return DOCS;
    }

    const form = event.widgetContext.forms.all;
    const database = form.database || event.database || 'default';
    const sql = form.sql || event.sql;
    const region = event.region || process.env.AWS_REGION;
    const accountId = context.invokedFunctionArn.split(":")[4];
    const athena = new AthenaClient({ region });

    let results;

    if (database && sql && sql.trim() !== '') {
        try {
            results = await executeQuery(athena, accountId, region, sql, database);
        } catch (e) {
            results = e;
        }
    }

    return CSS + await displayResults(database, sql, results, region, context);
};
