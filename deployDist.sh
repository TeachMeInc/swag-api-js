#!/usr/bin/env bash
aws s3 sync --acl public-read ./dist/ s3://swagapi.shockwave.com/dist/
aws cloudfront create-invalidation --distribution-id E1CCE956VLMAE9 --paths /dist/*
