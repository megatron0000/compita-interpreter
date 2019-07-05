# Gramática em nearley para a linguagem COMPITA2019
# Este arquivo gera automaticamente o "grammar.ts" para uso programático

@preprocessor typescript

@{%
const lexer = require('../lexycon/lexer').lexer
%}

@lexer lexer

Prog -> %PROGRAM %ID %OPBRACE GlobDecls Functions %CLBRACE {%
    data => ({
        nodeName: 'Prog',
        nodeChildren: data
    })
%}

GlobDecls -> null {%
    data => ({
        nodeName: 'GlobDecls',
        nodeChildren: data
    })
%}
 | %GLOBAL %COLON DeclList {%
    data => ({
        nodeName: 'GlobDecls',
        nodeChildren: data
    })
%}

DeclList -> Declaration {%
    data => ({
        nodeName: 'DeclList',
        nodeChildren: data
    })
%}
 | DeclList Declaration {%
    data => ({
        nodeName: 'DeclList',
        nodeChildren: data
    })
%}

Declaration -> Type ElemList %SCOLON {%
    data => ({
        nodeName: 'Declaration',
        nodeChildren: data
    })
%}

Type -> %INT {%
    data => ({
        nodeName: 'Type',
        nodeChildren: data
    })
%}
 | %FLOAT {%
    data => ({
        nodeName: 'Type',
        nodeChildren: data
    })
%}
 | %CHAR {%
    data => ({
        nodeName: 'Type',
        nodeChildren: data
    })
%}
 | %LOGIC {%
    data => ({
        nodeName: 'Type',
        nodeChildren: data
    })
%}
 | %VOID {%
    data => ({
        nodeName: 'Type',
        nodeChildren: data
    })
%}

ElemList -> Elem {%
    data => ({
        nodeName: 'ElemList',
        nodeChildren: data
    })
%}
 | ElemList %COMMA Elem {%
    data => ({
        nodeName: 'ElemList',
        nodeChildren: data
    })
%}

Elem -> %ID Dims {%
    data => ({
        nodeName: 'Elem',
        nodeChildren: data
    })
%}

Dims -> null {%
    data => ({
        nodeName: 'Dims',
        nodeChildren: data
    })
%}
 | %OPBRAK DimList %CLBRAK {%
    data => ({
        nodeName: 'Dims',
        nodeChildren: data
    })
%}

DimList -> %INTCT {%
    data => ({
        nodeName: 'DimList',
        nodeChildren: data
    })
%}
 | DimList %COMMA %INTCT {%
    data => ({
        nodeName: 'DimList',
        nodeChildren: data
    })
%}

Functions -> %FUNCTIONS %COLON FuncList {%
    data => ({
        nodeName: 'Functions',
        nodeChildren: data
    })
%}

FuncList -> Function {%
    data => ({
        nodeName: 'FuncList',
        nodeChildren: data
    })
%}
 | FuncList Function {%
    data => ({
        nodeName: 'FuncList',
        nodeChildren: data
    })
%}

Function -> Header %OPBRACE LocDecls Stats %CLBRACE {%
    data => ({
        nodeName: 'Function',
        nodeChildren: data
    })
%}

Header -> %MAIN {%
    data => ({
        nodeName: 'Header',
        nodeChildren: data
    })
%}
 | Type %ID %OPPAR Params %CLPAR {%
    data => ({
        nodeName: 'Header',
        nodeChildren: data
    })
%}

Params -> null {%
    data => ({
        nodeName: 'Params',
        nodeChildren: data
    })
%}
 | ParamList {%
    data => ({
        nodeName: 'Params',
        nodeChildren: data
    })
%}

ParamList -> Parameter {%
    data => ({
        nodeName: 'ParamList',
        nodeChildren: data
    })
%}
 | ParamList %COMMA Parameter {%
    data => ({
        nodeName: 'ParamList',
        nodeChildren: data
    })
%}

Parameter -> Type %ID {%
    data => ({
        nodeName: 'Parameter',
        nodeChildren: data
    })
%}

LocDecls -> null {%
    data => ({
        nodeName: 'LocDecls',
        nodeChildren: data
    })
%}
 | %LOCAL %COLON DeclList {%
    data => ({
        nodeName: 'LocDecls',
        nodeChildren: data
    })
%}

Stats -> %STATEMENTS %COLON StatList {%
    data => ({
        nodeName: 'Stats',
        nodeChildren: data
    })
%}

StatList -> null {%
    data => ({
        nodeName: 'StatList',
        nodeChildren: data
    })
%}
 | StatList Statement {%
    data => ({
        nodeName: 'StatList',
        nodeChildren: data
    })
%}

Statement -> CompStat {%
    data => ({
        nodeName: 'Statement',
        nodeChildren: data
    })
%}
 | IfStat {%
    data => ({
        nodeName: 'Statement',
        nodeChildren: data
    })
%}
 | WhileStat {%
    data => ({
        nodeName: 'Statement',
        nodeChildren: data
    })
%}
 | DoStat {%
    data => ({
        nodeName: 'Statement',
        nodeChildren: data
    })
%}
 | ForStat {%
    data => ({
        nodeName: 'Statement',
        nodeChildren: data
    })
%}
 | ReadStat {%
    data => ({
        nodeName: 'Statement',
        nodeChildren: data
    })
%}
 | WriteStat {%
    data => ({
        nodeName: 'Statement',
        nodeChildren: data
    })
%}
 | AssignStat {%
    data => ({
        nodeName: 'Statement',
        nodeChildren: data
    })
%}
 | CallStat {%
    data => ({
        nodeName: 'Statement',
        nodeChildren: data
    })
%}
 | ReturnStat {%
    data => ({
        nodeName: 'Statement',
        nodeChildren: data
    })
%}
 | %SCOLON {%
    data => ({
        nodeName: 'Statement',
        nodeChildren: data
    })
%}

CompStat -> %OPBRACE StatList %CLBRACE {%
    data => ({
        nodeName: 'CompStat',
        nodeChildren: data
    })
%}

IfStat -> %IF %OPPAR Expression %CLPAR Statement ElseStat {%
    data => ({
        nodeName: 'IfStat',
        nodeChildren: data
    })
%}

ElseStat -> null {%
    data => ({
        nodeName: 'ElseStat',
        nodeChildren: data
    })
%}
 | %ELSE Statement {%
    data => ({
        nodeName: 'ElseStat',
        nodeChildren: data
    })
%}

WhileStat -> %WHILE %OPPAR Expression %CLPAR Statement {%
    data => ({
        nodeName: 'WhileStat',
        nodeChildren: data
    })
%}

DoStat -> %DO Statement %WHILE %OPPAR Expression %CLPAR %SCOLON {%
    data => ({
        nodeName: 'DoStat',
        nodeChildren: data
    })
%}

ForStat -> %FOR %OPPAR Variable %ASSIGN Expression %SCOLON Expression %SCOLON Variable %ASSIGN Expression %CLPAR Statement {%
    data => ({
        nodeName: 'ForStat',
        nodeChildren: data
    })
%}

ReadStat -> %READ %OPPAR ReadList %CLPAR %SCOLON {%
    data => ({
        nodeName: 'ReadStat',
        nodeChildren: data
    })
%}

ReadList -> Variable {%
    data => ({
        nodeName: 'ReadList',
        nodeChildren: data
    })
%}
 | ReadList %COMMA Variable {%
    data => ({
        nodeName: 'ReadList',
        nodeChildren: data
    })
%}

WriteStat -> %WRITE %OPPAR WriteList %CLPAR %SCOLON {%
    data => ({
        nodeName: 'WriteStat',
        nodeChildren: data
    })
%}

WriteList -> WriteElem {%
    data => ({
        nodeName: 'WriteList',
        nodeChildren: data
    })
%}
 | WriteList %COMMA WriteElem {%
    data => ({
        nodeName: 'WriteList',
        nodeChildren: data
    })
%}

WriteElem -> %STRING {%
    data => ({
        nodeName: 'WriteElem',
        nodeChildren: data
    })
%}
 | Expression {%
    data => ({
        nodeName: 'WriteElem',
        nodeChildren: data
    })
%}

CallStat -> %CALL FuncCall %SCOLON {%
    data => ({
        nodeName: 'CallStat',
        nodeChildren: data
    })
%}

FuncCall -> %ID %OPPAR Arguments %CLPAR {%
    data => ({
        nodeName: 'FuncCall',
        nodeChildren: data
    })
%}

Arguments -> null {%
    data => ({
        nodeName: 'Arguments',
        nodeChildren: data
    })
%}
 | ExprList {%
    data => ({
        nodeName: 'Arguments',
        nodeChildren: data
    })
%}

ReturnStat -> %RETURN %SCOLON {%
    data => ({
        nodeName: 'ReturnStat',
        nodeChildren: data
    })
%}
 | %RETURN Expression %SCOLON {%
    data => ({
        nodeName: 'ReturnStat',
        nodeChildren: data
    })
%}

AssignStat -> Variable %ASSIGN Expression %SCOLON {%
    data => ({
        nodeName: 'AssignStat',
        nodeChildren: data
    })
%}

ExprList -> Expression {%
    data => ({
        nodeName: 'ExprList',
        nodeChildren: data
    })
%}
 | ExprList %COMMA Expression {%
    data => ({
        nodeName: 'ExprList',
        nodeChildren: data
    })
%}

Expression -> AuxExpr1 {%
    data => ({
        nodeName: 'Expression',
        nodeChildren: data
    })
%}
 | Expression %OR AuxExpr1 {%
    data => ({
        nodeName: 'Expression',
        nodeChildren: data
    })
%}

AuxExpr1 -> AuxExpr2 {%
    data => ({
        nodeName: 'AuxExpr1',
        nodeChildren: data
    })
%}
 | AuxExpr1 %AND AuxExpr2 {%
    data => ({
        nodeName: 'AuxExpr1',
        nodeChildren: data
    })
%}

AuxExpr2 -> AuxExpr3 {%
    data => ({
        nodeName: 'AuxExpr2',
        nodeChildren: data
    })
%}
 | %NOT AuxExpr3 {%
    data => ({
        nodeName: 'AuxExpr2',
        nodeChildren: data
    })
%}

AuxExpr3 -> AuxExpr4 {%
    data => ({
        nodeName: 'AuxExpr3',
        nodeChildren: data
    })
%}
 | AuxExpr4 %RELOP AuxExpr4 {%
    data => ({
        nodeName: 'AuxExpr3',
        nodeChildren: data
    })
%}

AuxExpr4 -> Term {%
    data => ({
        nodeName: 'AuxExpr4',
        nodeChildren: data
    })
%}
 | AuxExpr4 %ADOP Term {%
    data => ({
        nodeName: 'AuxExpr4',
        nodeChildren: data
    })
%}

Term -> Factor {%
    data => ({
        nodeName: 'Term',
        nodeChildren: data
    })
%}
 | Term %MULTOP Factor {%
    data => ({
        nodeName: 'Term',
        nodeChildren: data
    })
%}

Factor -> Variable {%
    data => ({
        nodeName: 'Factor',
        nodeChildren: data
    })
%}
 | %INTCT {%
    data => ({
        nodeName: 'Factor',
        nodeChildren: data
    })
%}
 | %FLOATCT {%
    data => ({
        nodeName: 'Factor',
        nodeChildren: data
    })
%}
 | %CHARCT {%
    data => ({
        nodeName: 'Factor',
        nodeChildren: data
    })
%}
 | %TRUE {%
    data => ({
        nodeName: 'Factor',
        nodeChildren: data
    })
%}
 | %FALSE {%
    data => ({
        nodeName: 'Factor',
        nodeChildren: data
    })
%}
 | %NEG Factor {%
    data => ({
        nodeName: 'Factor',
        nodeChildren: data
    })
%}
 | %ADOP Factor {%
    data => ({
        nodeName: 'Factor',
        nodeChildren: data
    })
%}
 | %OPPAR Expression %CLPAR {%
    data => ({
        nodeName: 'Factor',
        nodeChildren: data
    })
%}
 | FuncCall {%
    data => ({
        nodeName: 'Factor',
        nodeChildren: data
    })
%}

Variable -> %ID Subscripts {%
    data => ({
        nodeName: 'Variable',
        nodeChildren: data
    })
%}

Subscripts -> null {%
    data => ({
        nodeName: 'Subscripts',
        nodeChildren: data
    })
%}
 | %OPBRAK SubscrList %CLBRAK {%
    data => ({
        nodeName: 'Subscripts',
        nodeChildren: data
    })
%}

SubscrList -> AuxExpr4 {%
    data => ({
        nodeName: 'SubscrList',
        nodeChildren: data
    })
%}
 | SubscrList %COMMA AuxExpr4 {%
    data => ({
        nodeName: 'SubscrList',
        nodeChildren: data
    })
%}

