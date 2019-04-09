import angular = require('angular')
import { lex } from './lab2/lexer'

const module = angular.module('CompilerApp', [])

module.controller('Lab2Controller', [
    '$scope',
    $scope => {
        $scope.sentence_input = ''
        $scope.question_number_input = 1

        $scope.on_sentence_change = function() {
            $scope.sentence_tokens = lex($scope.sentence_input)
        }
    }
])

export { module }
