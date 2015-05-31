// app/chart/c3NewChart.js
// custom directive to create charts (c3 wraps d3)
// --------------------------------------------------------------------------------
(function() {
  'use strict';

  angular
    .module('myApp')
    .directive('c3NewChart', c3NewChart);

  c3NewChart.$inject = ['d3Service', 'ChartService'];

  function c3NewChart(d3Service, ChartService) {
    var directive = {
      link: linkFunc,
      restrict: 'AE',
      scope: {
        chart: '='
      },      
    };
    return directive;

    function linkFunc(scope, element, attrs) {
      d3Service.d3().then(function(d3) {  
        scope.triggerGenerateChart = function() {
          ChartService.generateChart(
            scope.$parent.chart.json_data,
            scope.$parent.chart.chartType,
            '#newChart'
          );          
        };  

        scope.triggerGenerateGraph = function() {
          var container = document.getElementById('hotTableBinding');
          new Handsontable(container, {
            data: scope.$parent.chart.json_data,
            minSpareRows: 1,
            colHeaders: true,
            contextMenu: true,
            afterChange: function() {
              scope.triggerGenerateChart();  
            }            
          });            
        };

        scope.$parent.$watch('chart.show', function() {
          if (scope.$parent.chart.show) {
            console.log("triggered")
            scope.triggerGenerateChart();  
            scope.triggerGenerateGraph();
          }
        });

        scope.$parent.$watch('chart.chartType', function() {
          scope.triggerGenerateChart();
        });

        scope.$parent.$watch('chart.json_data', function() {
          scope.triggerGenerateChart();
        });          
      });
    }
  }
})();

// app/chart/ChartService.js
// --------------------------------------------------------------------------------
(function() {
  'use strict';

  angular
    .module('myApp')
    .service('ChartService', ChartService);

  ChartService.$inject = ['$http'];

  function ChartService($http) {
    var vm = this;

    vm.createChart = function(userId, subjId, subjType, jsonData, chartType) {
      var dataObj = {};
      dataObj['chart'] = {};
      dataObj['chart']['user_id'] = userId;
      dataObj['chart']['subject_id'] = subjId;
      dataObj['chart']['subject_type'] = subjType;
      dataObj['chart']['json_data'] = jsonData;
      dataObj['chart']['chart_options'] = {};
      dataObj['chart']['chart_options']['chart_type'] = chartType;
      // dataObj['chart']['tag'] = slideType;

      return $http({
        method: 'POST',
        url: '/charts.json',
        data: dataObj
      }).success(function(resp) {
        return resp.data;
      }).error(function(resp) {
        console.log('error persist chart data')
      });
    };

    vm.getChart = function(chartId) {
      var theUrl = '/charts/' + chartId + '.json';
      return $http({
        url: theUrl,
        method: 'GET'
      }).success(function(resp) {
        return resp;
      }).error(function() {
        console.log('error getChart')
      });
    };

    vm.updateChart = function(chartId, chartObj) {
      var theUrl = '/charts/' + chartId + '.json';
      var chartData = {};
      chartData['chart'] = {};
      chartData['chart'] = chartObj;

      return $http({
        url: theUrl,
        method: 'PUT',
        data: chartData
      }).success(function(resp) {
        return resp;
      }).error(function() {
        console.log('error getChart')
      });      
    };

    vm.removeNullValues = function(twoDimArr) {
      var returnArr = [];
      _.each(twoDimArr, function(oneDimArr) {
        if (_.without(oneDimArr, null).length > 0) {
          returnArr.push(oneDimArr)
        }
      });

      return returnArr;
    };

    vm.generateChart = function(chartData, chartType, selector) {
      c3.generate({
        bindto: selector,
        size: {
          height: 400,
          width: 700
        },
        margin: {
          left: 20
        },
        padding: {
          right: 30,
          top: 25,
          left: 20,
          bottom: 25
        },            
        data: {
          x: chartData[0][0],
          type: chartType,
          columns: this.removeNullValues(chartData),
          axes: {
            secondAxis : 'y2'
          }
        },
        grid: {
          x: {
            show: false
          },
          y: {
            show: false
          }
        },
        axis: {
          rotated: false,
          x: {
            type: 'timeseries',
            tick: {
              format: '%m-%d-%y'
            },
            outer: false
          },
          y: {
            padding: {
              // bottom: 0
            },
            label: {
              text: chartData[1][0],
              position: 'outer-middle',
            }
          },
          y2: {
            show: false
          }
        },
      }); 

      d3.selectAll('g.tick').style('fill', '#666666');
      d3.select('g.c3-event-rects').style("fill-opacity", "1").style('fill', 'rgba(255,255,255,0.9)')
      d3.select('g.c3-axis-x').selectAll('text').attr("transform", function(d) {
        return "rotate(35)" 
      }).style("text-anchor", "start").attr("dx", "3em").attr("dy", "1em");
      d3.selectAll('g.c3-legend-item').attr("transform", "translate(0,10)");
      d3.select('text.c3-axis-y-label').attr("y", "-50");          
    };   
  }

})();

// conversations.html 
// --------------------------------------------------------------------------------
<span ng-controller="ConversationsCtrl">
  <h2 class="marg-l-20">{{project.name}} Inbox</h2>

  <h3 class="inpage-nav clearfix width-100">
    <a href class="tag-with-num"
      ng-class="{'active': activeSlider == 'all'}" 
      ng-click="setActiveSlider('all'); setConvoItems('all')">
      All Messages
      <span class="num-box gray">
        {{allConvoItems.length || 0}}
      </span>  
    </a>

    <a href class="tag-with-num"
      ng-class="{'active': activeSlider == 'new'}" 
      ng-click="setActiveSlider('new'); setConvoItems('new')">
      New Messages
      <span class="num-box"
        ng-class="newConvoItems.length > 0 ? 'red' : 'gray'">
        {{newConvoItems.length || 0}}
      </span>
    </a>

    <a href class="tag-with-num"
      ng-class="{'active': activeSlider == 'pending'}" 
      ng-click="setActiveSlider('pending'); setConvoItems('pending')">
      Pending Response
      <span class="num-box"
        ng-class="newConvoItems.length > 0 ? 'blue' : 'gray'">
        {{ pendingConvoItems.length || 0}}
      </span>
    </a> 

    <a href class="tag-with-num gray"
      ng-class="{'active': activeSlider == 'pending'}" 
      ng-click="setActiveSlider('archived'); setConvoItems('archived')">
      Archived
      <span class="num-box gray">
        {{ archivedItems.length || 0}}
      </span>
    </a>     
  </h3>

  <div class="convo-section-wrap clearfix width-100" ng-repeat="convoItem in convoItems">
    <span am-time-ago="convoItem.conversation.updated_at" class="message-time"></span>    
    <span ng-if="convoItem.conversation">
      <h3>{{convoItem.messages[0].message.body}} - {{convoItem.messages[0].author.email}}</h3>
      <p>Conversation with: {{convoItem.convo_participants}}</p>
      <span class="convo-actions">
        <div ng-include src="'/assets/conversations/_respond_to_msg.html'"></div>  
      </span>  
    </span>

    <div class="inline-blk" ng-if="convoItem.connection">
      <span am-time-ago="convoItem.connection.created_at" class="message-time"></span>
      <h3>{{project.name}} has a new {{convoItem.connection.type_of}}: {{convoItem.user.email}}</h3>
      <p ng-if="convoItem.conversation_with_messages[0].messages">
        Last message: {{convoItem.conversation_with_messages[0].messages[0].message.body}} - 
        {{convoItem.conversation_with_messages[0].messages[0].author.email}}
      </p>
      <span class="convo-actions">
        <div ng-include src="'/assets/conversations/_new_connection.html'"></div>  
      </span>
    </div>    
  </div>
</span>


// ConversationCtrl.js
// --------------------------------------------------------------------------------
(function() {
  'use strict';

  angular
    .module('myApp')
    .controller('ConversationsController', ConversationsController);

  ConversationsController.$inject = [
    '$scope', '$http', '$rootScope', '$stateParams', 
    '$websocket', 'ConversationService'
  ];

  function ConversationsController(
    $scope, $http, $rootScope, $stateParams, 
    $websocket, ConversationService) {

    $scope.chatMessage = {};
    $scope.chatMessages = ['start'];
    $scope.collapseSidebar = { show: false };
    
    var vm = this;

    vm.awesomeClicked     = awesomeClicked;
    vm.commentIndex       = {};
    vm.createConvoAndMsg  = createConvoAndMsg;
    vm.createMessage      = createMessage;
    vm.editCommentIndex   = {};
    vm.formatParticipants = formatParticipants;
    vm.newMsgForm         = {};
    vm.newNote            = {};
    vm.setConvoItems      = setConvoItems;
    vm.setMessageForm     = setMessageForm;
    vm.showDropNote       = {};
    vm.showMessageBox     = {};
    vm.updateStatus       = updateStatus;

    activate();

    function activate() {
      $rootScope.activeTab = 'chat';
      vm.dispatcher = new WebSocketRails('localhost:3000/websocket');

      $scope.getConversation = function(convId) {
        ConversationService.getConversation(convId).then(function(resp) {
          vm.currentConversation = resp.data;

          setMessageForm('NA',
            $rootScope.currentUser.id,
            vm.currentConversation.id,
            'NA');

          triggerDispatcher();        
        });
      }; 
            
      if ($stateParams.projectId) {
        getConversationFeed($stateParams.projectId, 'all');
      } else {
        ConversationService.getConversations().then(function(resp) {
          vm.allConvoItems = _.sortBy(resp.data, 'updated_at');
        });
      }

      if ($scope.$stateParams.convId) {
        $scope.getConversation($scope.$stateParams.convId);
      }

      _.mixin(_.string.exports());      
    } 

    function formatParticipants(participants){
      var names = [];
      _.each(participants, function(participant) {
        names.push(participant.first_name);
      });

      console.log(names)
      return names.join(', ');
    }

    function createConvoAndMsg(recipientId, subjId, subjType, subjTag, subjMatter) {
      ConversationService.createConvoAndMsg(recipientId, subjId, subjType, 
        subjTag, subjMatter, $rootScope.currentUser.id, vm.newNote.body).then(function(data) {
          getConversationFeed($stateParams.projectId);
          vm.hideMessageWrap = true;
      });
    }

    function awesomeClicked(currentUserId, message) {
      return _.findWhere(message.awesomes, { user_id: currentUserId });
    }

    function getConversationFeed(projId, setting) {
      var theUrl = '/conversations/feed.json?project_id=' + projId;
      ConversationService.getConversationFeed(theUrl).then(function(resp) {
        // .concat(_.where($scope.allActivities, {has_unviewed_comments: true}));
        vm.allConvoItems = _.sortBy(resp.data, 'updated_at').reverse();
        vm.newConvoItems = _.where(vm.allConvoItems, {viewed: false});
        vm.pendingConvoItems = filterConvoItems('pending');   
        setConvoItems(setting);  
      });
    }

    function setConvoItems(theSetting) {
      switch (theSetting) {
        case 'all': 
          vm.convoItems = vm.allConvoItems;
          break;
        case 'new':
          vm.convoItems = vm.newConvoItems;
          break;
        case 'pending': 
          vm.convoItems = vm.pendingConvoItems;
          break;
        case 'archived': 
          vm.convoItems = filterConvoItems('archived');
          break;
        default: 
          vm.convoItems = vm.allConvoItems;
      }
    }

    function filterConvoItems(statusType) {
      var responseArr = [];
      _.each(vm.allConvoItems, function(convoItem) {
        if (convoItem.subject && convoItem.subject['status'] == statusType) {
          responseArr.push(convoItem);
        }
      });

      return responseArr;
    }

    function updateStatus(id, subjectType, statusUpdate) {
      var className = _(subjectType).underscored();
      var urlString = '/' + className + 's/' + id + '.json';
      var dataObj = {};
      dataObj[className] = {};
      dataObj[className]['status'] = statusUpdate;

      $http({
        method: 'PATCH',
        url: urlString,
        data: dataObj
      }).success(function() {
        console.log('success')
        getConversationFeed($stateParams.projectId, $scope.activeSlider);
      }).error(function() {
        console.log('error')
      });
    }

    function setActiveSlider(selectedSlider) {
      $scope.activeSlider = selectedSlider;
    }

    function setMessageForm(msgIdx, currentUserId, convId, parentMsgId) {
      if (vm.showMessageBox.index == msgIdx) {
        vm.showMessageBox.index = null;
      } else {
        vm.showMessageBox.index = msgIdx;
      }

      vm.newMsgForm.author_id = currentUserId;
      vm.newMsgForm.subject_line = '';
      vm.newMsgForm.conversation_id = convId;
      vm.newMsgForm.parent_message_id = parentMsgId;
    }

    function triggerDispatcher() {
      vm.channel = vm.dispatcher.subscribe(vm.currentConversation.id);
      vm.channel.bind('new_message', function(data) {
        vm.currentConversation.messages.push(JSON.parse(data));
        $scope.$apply();
        // $('#chatTarget').append('<p>' + data.message + '</p>')
        // $scope.chatMessages.push(data)
        // $scope.$apply()
      });         
    }


    function createMessage(convId) {
      if (vm.newMsgForm.body == '') {
        return;
      } else {
        vm.newMsgForm.author_id = $rootScope.currentUser.id;
        vm.newMsgForm.subject_line = '';
        vm.newMsgForm.conversation_id = convId;

        vm.dispatcher.trigger('new_message_created', vm.newMsgForm);

        ConversationService.createMessage(vm.newMsgForm).then(function(resp) {
          vm.newMsgForm.body = '';
        });
      }
    }

  }
})();