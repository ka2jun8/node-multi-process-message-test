# node-multi-process-message-test

When multi processes run on node.js using ```cluster.fork```, 
it shows how to communicate among processes.

* server start
```
npm install
npm start
```

* test
```
curl -G --url http://localhost:8000/increment 
```
