#!/bin/bash
lib=$1
n=$2
while [ 0 != $n ]
do
   eval $lib
   sleep $3
   if [ "$n" -gt "0" ]
   then
   		n=`expr $n - 1`
   fi
done
