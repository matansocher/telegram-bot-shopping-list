

module.exports = (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,user,session-token,application,x-zisession,x-ziid,if-modified-since,Cache-Control,x-datadog-trace-id,x-datadog-parent-id,x-datadog-origin,x-datadog-sampling-priority,x-datadog-sampled');
    res.setHeader('Access-Control-Allow-Credentials', true);

    if (req.method === 'OPTIONS') {
        res.status( 200 );
        res.end();
    } else {
        next();
    }
}
