#!/bin/bash
# Set default settings, pull repository, build
# app, etc., _if_ we are not given a different
# command.  If so, execute that command instead.
set -e

# Default values
: ${APP_DIR:="/app/www"}
: ${SRC_DIR:="/app/src"}
: ${MONGO_URL:="mongodb://${MONGO_PORT_27017_TCP_ADDR}:${MONGO_PORT_27017_TCP_PORT}/${DB}"}
: ${PORT:="80"}


export MONGO_URL
export PORT

# See if we have a valid meteor source
METEOR_DIR=$(find ${SRC_DIR} -type d -name .meteor -print |head -n1)
if [ -e "${METEOR_DIR}" ]; then
   echo "Meteor source found in ${METEOR_DIR}"
   cd ${METEOR_DIR}/..

   echo "installing meteor build dependency"
   meteor npm install --save babel-runtime
    meteor npm install --global downloadjs
    meteor npm install --save downloadjs

   # Bundle the Meteor app
   echo "Building the bundle...(this may take a while)"
   mkdir -p ${APP_DIR}
   meteor build --directory --allow-superuser ${APP_DIR}
fi

# Locate the actual bundle directory
# subdirectory (default)
if [ ! -e ${BUNDLE_DIR:=$(find ${APP_DIR} -type d -name bundle -print |head -n1)} ]; then
   # No bundle inside app_dir; let's hope app_dir _is_ bundle_dir...
   BUNDLE_DIR=${APP_DIR}
fi

# Install NPM modules
if [ -e ${BUNDLE_DIR}/programs/server ]; then
   pushd ${BUNDLE_DIR}/programs/server/


   echo "Installing NPM prerequisites..."
   # Install all NPM packages
   meteor npm install --save downloadjs
   npm install
  
   popd
else
   echo "Unable to locate server directory in ${BUNDLE_DIR}; hold on: we're likely to fail"
fi

if [ ! -e ${BUNDLE_DIR}/main.js ]; then
   echo "Failed to locate main.js in ${BUNDLE_DIR}; build failed."
   exit 1
fi
