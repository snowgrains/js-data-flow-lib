/*
    SnowGrains Javascript Data Flow Library

    Helps controlling data flow in your Javascript based application and
    lightweight QML applications.


    MIT License

    Copyright (c) 2019 SnowGrains

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.

    Source code available in
    https://github.com/snowgrains/js-data-flow-lib.git

*/

.pragma library

var JSDataFlow = function(){
    var actions=[]
    var stores=[]
    var middlewares=[]
    var ongoingAction=[]
    var loglevel = 0
    var LOGINFO = 1
    var LOGERROR = 2
    var timer = null

    this.log=function(level, txt){
        if (loglevel === 0)
            return

        if (loglevel >=level)
            console.log("JSDATAFLOW INFO:"+txt)
        if (loglevel >= level)
            console.log("JSDATAFLOW ERROR:"+txt)
    }
    this.setTimer = function(externalTimer){
        timer = externalTimer
    }

    this.doThread = function(func){
        var theThis = this
        timer.setTimeout(theThis,func, 1);
    }

    this.registerAction =function(action){
        var theAction = action
        var theThis = this
        this[action] =  function(params) {theThis.doAction(theAction,params)}
        this.log(LOGINFO, "Registering function " + action)
        return this[action]
    }

    this.registerStore = function (store){
        stores.push(store)
        this.log(LOGINFO, "Registering Store " + store)
    }

    this.registerMiddleware = function (middleware){
        middlewares.push(middleware)
        this.log(LOGINFO, "Registering Middlware" + middleware)
    }

    this.doAction = function (action, params){
        ongoingAction.push({action: action, params: params, mw_index:-1, store_index:-1})

        this.doThread(function(owner){
            owner.executeNext(0)}
        )
    }

    this.executeNext = function (actionIndex){

        // 1. Call middlewares first
        if (ongoingAction[actionIndex] !== undefined &&
            ongoingAction[actionIndex].mw_index+1 < middlewares.length ){
            ongoingAction[actionIndex].mw_index++

            var action = ongoingAction[actionIndex].action
            var params = ongoingAction[actionIndex].params
            if (middlewares[ongoingAction[actionIndex].mw_index].dispatch){
                middlewares[ongoingAction[actionIndex].mw_index].dispatch(action,params,this)
                this.doNext(action, params)
            }
            else
                this.doNext(action, params)

        } else { // 2. Call store instances next

            if (ongoingAction[actionIndex] !== undefined &&
                ongoingAction[actionIndex].store_index+1 < stores.length){
                ongoingAction[actionIndex].store_index++

                var action = ongoingAction[actionIndex].action
                var params = ongoingAction[actionIndex].params

                if (stores[ongoingAction[actionIndex].store_index].dispatch){
                    stores[ongoingAction[actionIndex].store_index].dispatch(action,params,this)
                    this.doNext(action, params)
                }
                else
                    this.doNext(action, params)


            }
         else
        // 3. No actions anymore - remove from the list
        if (ongoingAction[actionIndex] !== undefined &&
            ongoingAction[actionIndex].store_index+1 >= stores.length &&
            ongoingAction[actionIndex].mw_index+1 >= middlewares.length) {
            ongoingAction = ongoingAction.splice(actionIndex+1,1)

            this.log(LOGINFO,"Ongoing actions buffer count:"+ongoingAction.length)
            this.log(LOGINFO,"Removing action index"+actionIndex)
        }
        }

    }

    this.doNext = function (action, params)
    {
        var found = false
        var actionIndex=0

        for (var i=ongoingAction.length-1; i >=0 ; i--){
            if (ongoingAction[i].action === action){
                found=true
                actionIndex=i
                this.log(LOGINFO, "Found action " + action)
                break;
            }
        }
        if (found)
           this.executeNext(actionIndex)
    }
}




