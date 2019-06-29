import angular = require('angular')
import { lex } from './lab2/lexer'
import autosize = require('autosize')
import debounce = require('debounce')
import { PrinterVisitor } from './lab3456/visualization/printer';
import { ConvertToAST } from './lab3456/conversion';
import { Parse } from './lab3456/verbosetree/parser';
import { FillSymbolTable, UniqueMainFunction, DeclareBeforeUse, ResolveTypesInPlace, IfCalledThenIsFunction, CallStatementMustReturnVoid, NoVoidIdentifier, OperandsCompatibleWithOperators, PositiveVectorDimensions, IfDeclaredThenMustInitializeAndReference, AssignmentTypeCompatibility, IndexingDimensionsMustMatch, IfWhileDoForMustHaveLogicalExpressions, ForMustBeInitializedByScalar, ForInitializerMustMatchIncrement, MustIndexWithIntLikeExpressions, ExpressionDoesNotAdmitVoidCalls, NoClashWithProgramName, NoFunctionPointers, ArgumentCountsMustMatch, ArgumentTypesMustBeCompatible, ReturnStatementMustMatchFunctionType, RecursiveCallsAreNotSupported } from './lab3456/semantics/checkers';
import { assertNotNull } from './common';

function setPrettyCode(text: string) {
  const event = new Event('prettyCodeChanged')
  //@ts-ignore
  event.prettyCode = text
  window.dispatchEvent(event)
}

const module = angular.module('CompilerApp', [])

module.controller('Lab2Controller', [
  '$scope',
  $scope => {
    $scope.sentence_input = ''
    $scope.question_number_input = 1

    $scope.on_sentence_change = function () {
      $scope.sentence_tokens = lex($scope.sentence_input)
    }
  }
])

module.controller('Lab3Controller', [
  '$scope',
  $scope => {
    $scope.symbols = []
    $scope.semanticalErrors = []
    //@ts-ignore
    window.getSemanticErrors = () => {
      return $scope.semanticalErrors
    }

    const sourceCodeEl = document.getElementById('lab3-source-code') as HTMLTextAreaElement
    if (!sourceCodeEl) {
      throw new Error()
    }
    autosize(sourceCodeEl)

    setTimeout(() => {
      $scope.sentence_input = `/*  Programa para contar as ocorrencias das palavras de um texto */

    program AnaliseDeTexto {
    
    /*  Variaveis globais  */
    
    global: 
      char nomes[50,10], palavra[10];
      int ntab, nocorr[50];
          char c; logic fim;
    
    functions:
    
    /*  Funcao para procurar uma palavra na tabela de palavras  */
    
    void c(int t) {
      statements:  
        t[0] <- 1;
    }
    
    int minhaFuncao() {
      statements:
    }
    
    int Procura () {
    
    local:
      int i, inf, sup, med, posic, compara;
          logic achou, fimteste;
    statements:
      achou <- false; inf <- 1; sup <- ntab;
      while (!achou && sup >= inf) {
        med <- (inf + sup) / 2;
        compara <- 0; fimteste <- false;
        for (i <- 0; !fimteste && compara = 0; i <- i+1) {
                  if (palavra[i] < nomes[med,i])
                     compara <- ~1;
                  else if (palavra[i] > nomes[med,i])
                     compara <- 1;
                  if (palavra[i] = '\0' || nomes[med,i] = '\0')
                     fimteste <- true;
        }
        if (compara = 0)
          achou <- true;
        else if (compara < 0)
          sup <- med - 1;
        else inf <- med + 1;
      }
      if (achou) posic <- med;
      else posic <- ~inf;
      return posic;
    
    } /* Fim da funcao Procura */
    
    /*  Funcao para inserir uma palavra na tabela de palavras  */
    
    void Inserir (int posic) {
    
    local:
      int i, j; logic fim;
    statements:
      ntab <- ntab + 1;
      for (i <- ntab; i >= posic+1; i <- i-1) {
            fim <- false;
            for (j <- 0; !fim; j <- j+1) {
                nomes[i,j] <- nomes[i-1,j];
                if (nomes[i,j] = '\0') fim <- true;
            }
         nocorr[i] <- nocorr[i-1];
      }
          fim <- false;
          for (j <- 0; !fim; j <- j+1) {
              nomes[posic,j] <- palavra[j];
              if (palavra[j] = '\0') fim <- true;
          }
      nocorr[posic] <- 1;
    
    } /* Fim da funcao Inserir */
    
    /*  Funcao para escrever a tabela de palavras  */
    
    void ExibirTabela () {
    
    local:
      int i; logic fim;
    statements:
      write ("          ", "Palavra             ",
                    "   Num. de ocorr.");
      for (i <- 1; i <= 50; i <- i+1) write ("-");
      for (i <- 1; i <= ntab; i <- i+1) {
        write ("\\n          "); fim <- false;
        for (j <- 0; !fim; j <- j+1) {
                if (nomes[i,j] = '\0') fim <- true;
                else write (nomes[i,j]);
           }
        write (" | ", nocorr[i]);
      }
    
    } /* Fim da funcao ExibirTabela */
    
    
    /*  Modulo principal  */
    
    main {
    
    local:
      int i, posic;
          char c; logic fim;
    statements:
      ntab <- 0;
      write ("Nova palavra? (s/n): ");
      read (c);
      while (c = 's' || c = 'S') {
              write ("\\nDigite a palavra: ");
              fim <- false;
        for (i <- 0; !fim; i <- i+1) {
                  read (palavra[i]);
                  if (palavra[i] = '\\n') {
                      fim <- true;
                      palavra[i] <- '\0';
                  }
              }
        posic <- Procura ();
        if (posic > 0)
          nocorr[posic] <- nocorr[posic] + 1;
        else
          call Inserir (~posic, i);
              write ("\\n\\nNova palavra? (s/n): ");
              read (c);
      }
      call ExibirTabela ();
    
    } /* Fim da funcao main */
    
    main {
      local:
        void yyy;
        logic x1[1, 0];
        int x2[0];
        float x3;
        char x4;
        int x5;
        logic AnaliseDeTexto;
    
      statements: 
        read(xxx); 
        call i(); 
        call Procura();
        while (i && true || 1 < true || 1 = true || 2.3 % 5 = 1) {
          x1[0, 0] <- x2[0];
          x3 <- x2[0];
          x4 <- x2[0, 1];
          x3 <- x1[0];
          x3 <- minhaFuncao;
          minhaFuncao <- 1;
          x3[1] <- 2.1;
        }
        for (x3 <- 2.1; true; x4 <- x4 + 1) {
    
        }
        for (x2[1] <- 0; 1 + 1; x2[0] <- x2[MyFloatFunction()] + 1) {
    
        }
        x5 <- Inserir(true, 0.1, MyFloatFunction);
    
    
    }
    
    float MyFloatFunction(int AnaliseDeTexto) {
      statements:
        return 1;
        return 1.1;
        return 'a';
        return;
        return true;
    }
    
    void MyVoidFunction() {
      statements:
        return 1;
    }
    
    void DirectRecursion() {
      statements:
        call DirectRecursion();
    }
    
    void IndirectRecursion1() {
      statements:
        call IndirectRecursion2();
    }
    
    void IndirectRecursion2() {
      statements:
        call IndirectRecursion1();
        call IndirectRecursion3();
    }
    
    void IndirectRecursion3() {
      statements:
        call IndirectRecursion1();
    }
    
    } /* Fim do programa AnaliseDeTexto */`
      setTimeout(() => autosize.update(sourceCodeEl), 100)
      $scope.$apply()
      $scope.onSourceChange()
    }, 100)

    $scope.onSourceChange = debounce(() => {
      try {

        let [ast, backmap] = ConvertToAST(
          Parse(
            sourceCodeEl.value as string
          ),
          true
        )

        let prettyCode = ''
        new PrinterVisitor(
          msg => prettyCode += msg + '\n',
          backmap
        ).visitProgram(ast)

        console.log(prettyCode)
        setPrettyCode(prettyCode);

        [ast, backmap] = ConvertToAST(Parse(prettyCode as string), true)

        const [symbolTable, errors] = new FillSymbolTable().execute(ast)

        new ResolveTypesInPlace().execute(ast, symbolTable)

        $scope.symbols = symbolTable.dump()
        $scope.semanticalErrors = errors
          .concat(new UniqueMainFunction().execute(ast, symbolTable))
          .concat(new DeclareBeforeUse().execute(ast, symbolTable))
          .concat(new IfCalledThenIsFunction().execute(ast, symbolTable))
          .concat(new CallStatementMustReturnVoid().execute(ast, symbolTable))
          .concat(new NoVoidIdentifier().execute(ast, symbolTable))
          .concat(new OperandsCompatibleWithOperators().execute(ast, symbolTable))
          .concat(new PositiveVectorDimensions().execute(ast, symbolTable))
          .concat(new IfDeclaredThenMustInitializeAndReference().execute(ast, symbolTable))
          .concat(new AssignmentTypeCompatibility().execute(ast, symbolTable))
          .concat(new IndexingDimensionsMustMatch().execute(ast, symbolTable))
          .concat(new IfWhileDoForMustHaveLogicalExpressions().execute(ast, symbolTable))
          .concat(new ForMustBeInitializedByScalar().execute(ast, symbolTable))
          .concat(new ForInitializerMustMatchIncrement().execute(ast, symbolTable))
          .concat(new MustIndexWithIntLikeExpressions().execute(ast, symbolTable))
          .concat(new ExpressionDoesNotAdmitVoidCalls().execute(ast, symbolTable))
          .concat(new NoClashWithProgramName().execute(ast, symbolTable))
          .concat(new NoFunctionPointers().execute(ast, symbolTable))
          .concat(new ArgumentCountsMustMatch().execute(ast, symbolTable))
          .concat(new ArgumentTypesMustBeCompatible().execute(ast, symbolTable))
          .concat(new ReturnStatementMustMatchFunctionType().execute(ast, symbolTable))
          .concat(new RecursiveCallsAreNotSupported().execute(ast, symbolTable))
          .map(error => ({
            ...error,
            ...error.localize(backmap)
          }))

        console.log($scope.semanticalErrors)

        $scope.$apply()

      } catch (err) {
        console.log(err)
        setPrettyCode(err.toString())
        $scope.symbols = []
        $scope.semanticalErrors = []
      }

    }, 500)

  }
])

export { module }
