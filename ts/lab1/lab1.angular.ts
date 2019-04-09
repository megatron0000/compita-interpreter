import angular = require('angular')
import { predicate1, predicate2, predicate3, predicate4, lex5 } from './lexer'

const module = angular.module('CompilerApp', [])

module.controller('Lab1Controller', [
    '$scope',
    $scope => {
        $scope.question2model = {
            1: {
                executor: predicate1,
                type: 'boolean'
            },
            2: {
                executor: predicate2,
                type: 'boolean'
            },
            3: {
                executor: predicate3,
                type: 'boolean'
            },
            4: {
                executor: predicate4,
                type: 'boolean'
            },
            5: {
                executor: lex5,
                type: 'explain'
            }
        }
        $scope.sentence_input = ''
        $scope.question_number_input = 1

        $scope.model = $scope.question2model[$scope.question_number_input]
        $scope.on_question_change = function() {
            $scope.model = $scope.question2model[$scope.question_number_input]
            $scope.on_sentence_change()
        }
        
        $scope.sentences = []
        $scope.sentence_with_tokens = []
        $scope.sentence_tokens = []
        $scope.on_sentence_change = function() {
            $scope.sentences = $scope.sentence_input.split('\n')
            $scope.sentence_tokens = $scope.sentences.map(sent => $scope.model.executor(sent))
            $scope.sentence_with_tokens = $scope.sentences.map(sent => ({
                sentence: sent,
                tokens: $scope.model.executor(sent)
            }))
        }
    }
])

export { module }
