#!/usr/bin/env bash
if [ -d "../swag-api-server/public" ]; then
  cp -R dist ../swag-api-server/public
  cp demo.html ../swag-api-server/public/demo.html
fi
