#include <iostream>
#include <ts_marco.h>

TS_SIGNATURE("declare class Test {")
class Test {
 public:
  /**
   * this is a test function
   */
  TS_SIGNATURE("echo(input:string):void")
  void echo(const char* input){
    std::cout << input << std::endl;
  }
};
TS_SIGNATURE("}")

int main(){
    return 0;
}