'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  router.post('/file/local/upload', controller.file.upload)
  router.post('/file/oss/upload', controller.file.oss)
};
