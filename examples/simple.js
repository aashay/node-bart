/*
* A simple example
*/

var bart = require('../bart');



function foo(){
    bart.on('dbrk', function(estimates){
        console.log(estimates);
    });
}

foo();

bart.on('error', function(err){
    console.log(err);
});