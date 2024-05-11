---
title: Custom OpenFOAM Equation of State
date: 2024-05-10 23:42:23
tags: [OpenFOAM, thermophysicalModel]
categories: 
- [OpenFOAM, Thermophysical Models, Equation of State]
---
Yo! Here is a guide on how to compile and run your custom equation of state in OpenFOAM. This is tested in OpenFOAM version 10. 

### Copy an existing Equation of State source code directory
Example: 
``` bash
$ cd $WM_PROJECT_DIR/src/thermophysicalModels/specie/equationOfState
$ cp -r pengRobinsonGas/ myEOS/
```
### Edit the source code files
#### *.C file
1. Replace all instance of <originalEOSname> with <yourEOSname>
2. Construct all user-defined coefficients/variables. Aka the coefficients you want your user to enter under phaseProperties.* file
3. Under Ostream operator, replace the Ostream variable name with any other name. E.g. pengRobinsonGas uses pg. 

#### *.H file
1. Replace all instance of <originalEOSname> with <yourEOSname>
2. Declare all user-defined coefficients/variables under private and public data.
3. Replace EOSname under typeName() declaration
4. Add additional functions that you want to solve for under Fundamental properties

Important: If you are impatient and try to do wmake at this point you might face an error saying that certain variables are defined and be tempted to comment out the 2nd line in
``` bash
#ifdef NoRepository
    #include "myN2O.C"
#endif
```
But don't! This line is needed. 
#### *I.H file
Here is where all your equations go. Do not try to insert the equations in the .C or .H file
1. Replace all instance of <originalEOSname> with <yourEOSname>
2. Initiate your user-defined coefficients/variables under Private Member Functions and Constructors. Remember to change the Ostream variable name here as well.
3. Write your equations to return functions with arguments P and T under Member Functions
4. If there is a function that your equation of state does not compute for, use NonImplemented

Example: 
``` bash
template<class Specie>
inline Foam::scalar Foam::myN2O<Specie>::alphav
(
    scalar rho,
    scalar T
) const
{
    NotImplemented;
    return 0;
}
```
### Add a myEOSThermo.C file to the directory
Example:
``` bash
/*---------------------------------------------------------------------------*\
  =========                 |
  \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox
   \\    /   O peration     |
    \\  /    A nd           | Copyright (C) 2011-2012 OpenFOAM Foundation
     \\/     M anipulation  |
-------------------------------------------------------------------------------
License
    This file is part of OpenFOAM.

    OpenFOAM is free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    OpenFOAM is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
    FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
    for more details.

    You should have received a copy of the GNU General Public License
    along with OpenFOAM.  If not, see <http://www.gnu.org/licenses/>.

\*---------------------------------------------------------------------------*/

#include "rhoThermo.H"
#include "forGases.H"

#include "specie.H"
#include "hConstThermo.H"
#include "sensibleEnthalpy.H"
#include "thermo.H"

#include "constTransport.H"

#include "myEOS.H"

#include "heRhoThermo.H"
#include "pureMixture.H"

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

namespace Foam
{

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
typedefThermo(constTransport, sensibleEnthalpy, hConstThermo, myEOS, specie);  

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

} // End namespace Foam

// ************************************************************************* //
```
### Add a Make folder with files and option file to the directory
#### Files
```bash
./myEOSThermo.C
LIB = $(FOAM_LIBBIN)/libmyEOS
```
#### Options
Example: 
```bash
EXE_INC = \
    -g \
    -I$(LIB_SRC)/finiteVolume/lnInclude \
    -I$(LIB_SRC)/thermophysicalModels/basic/lnInclude \
    -I$(LIB_SRC)/thermophysicalModels/specie/lnInclude \
    -I$(LIB_SRC)/thermophysicalModels/thermophysicalProperties/lnInclude \
    -I$(LIB_SRC)/physicalProperties/lnInclude \
    -I$(LIB_SRC)/ThermophysicalTransportModels/lnInclude 


LIB_LIBS = \
    -L$(FOAM_LIBBIN) \
    -lfiniteVolume \
    -lspecie \
    -lthermophysicalTransportModels \
    -lthermophysicalProperties \
    -lcompressibleInterPhaseTransportModel \
    -lmultiphaseInterFoam \
    -ltwoPhaseProperties \
    -ltwoPhaseMixture \
    -lcompressibleTwoPhaseChangeModels \
    -lcompressibleTwoPhaseMixture \
    -lcompressibleMomentumTransportModels \
    -lmyEOS \
    -lOpenFOAM
```
You might not require all these libraries or you might require more libraries depending on the solver you would like to use your equation of state with. 
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
thermoType
{
    type            heRhoThermo;
    mixture         pureMixture;
    transport       const;
    thermo          hConst;
    energy          sensibleEnthalpy;
    equationOfState myEOS;
    specie          specie;
}
```
Remember to declare your equation of state coefficients in your phaseProperties.* file
```bash
mixture
{
    equationOfState
    {
        a   1.0;
        b   1.0;
        c   1.0;
    }
}
```
### Run your case 
Yay you are done. Email spacecatloaf@gmail.com if this doesn't work in OF10, or it works/doesn't work in other OF versions. 
