var cluster = require("cluster");
var http = require("http");
var Router = require("router");
var finalhandler = require("finalhandler");

if (cluster.isMaster) {
    var webWorker = cluster.fork({ web_process: true });
    console.log("[Master] web worker start [id: "+webWorker.id+" pid: " + webWorker.process.pid + "]");

    var serviceWorker = cluster.fork({ service_process: true });
    console.log("[Master] service worker start [id: "+serviceWorker.id+" pid: " + serviceWorker.process.pid + "]");

    webWorker.on("message", function (request) {
        console.log("[Master] receive request from web worker: ", request);
        serviceWorker.send(request);
    });

    serviceWorker.on("message", function (response) {
        console.log("[Master] receive response from service worker: ", response);
        webWorker.send(response);
    });

    cluster.on("exit", function (worker, code, signal) {
        console.log("[Master] worker[" + worker.process.pid + "] was dead");
    });

    process.on("SIGINT", function () {
        for (let key in cluster.workers) {
            if (cluster.workers.hasOwnProperty(key)) {
                cluster.workers[key].kill();
            }
        }
    });

} else {

    if (process.env.web_process) {
        var router = Router();
        // router.use(bodyParser);

        router.get("/", function (req, res) {
            res.writeHead(200);
            res.end(JSON.stringify({ result: "Hello!" }));
        });

        router.get("/increment", function (req, res) {
            var action = "increment";
            var data = 1;
            var handler = function (response) {
                console.log("[Web Process] receive message from mastser process : ", response);
                res.writeHead(200);
                res.end(JSON.stringify(response));
                process.removeListener("message", handler);
            };
            process.on("message", handler);
            process.send({ action, data });
        });

        http.createServer(function (req, res) {
            router(req, res, finalhandler(req, res));

        }).listen(8000);
    } else if (process.env.service_process) {
        var result = 0;

        process.on("message", function (request) {
            console.log("[Service Process] receive message from mastser process : ", request);
            if (request.action === "increment") {
                result += request.data || 1;
                process.send({ result });
            }
        });

    }
}