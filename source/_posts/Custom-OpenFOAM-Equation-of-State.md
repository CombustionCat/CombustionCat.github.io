---
title: Custom OpenFOAM Equation of State
date: 2024-05-10 23:42:23
tags: OpenFOAM, thermophysicalModel
---
Yo! Here is a guide on how to compile and run your custom equation of state in OpenFOAM. This is tested in OpenFOAM version 10. 

### Copy an existing Equation of State source code directory

``` bash
$ cd $WM_PROJECT_DIR/src/thermophysicalModels/specie/equationOfState
$ cp pengRobinsonGas myEOS
```
### Edit the source code files
#### *.C file

#### *.H file

#### *I.H file

### Add a thermos.C file to the directory

### Add a Make folder with files and option file to the directory

### Compile OpemFOAM 
``` bash
$ cd $WM_PROJECT_DIR
$ wcleanPlatform
$ ./Allwmake
```
Grab a coffee while its compiling

### Edit the phaseProperties.* file in your case setup
Example:
``` bash
$ 
```
### Run your case 
Example:
``` bash
$ 
```

Yay you are done. Email spacecatloaf@gmail.com if this doesn't work in OF10, or it works/doesn't work in other OF versions. 
