#!/usr/bin/env bash
aws s3 sync ./dist/* s3://swagapi.shockwave.com/dist/
