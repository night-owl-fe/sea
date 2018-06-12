'use strict'

const Controller = require('egg').Controller
const sendToWormhole = require('stream-wormhole')
const awaitWriteStream = require('await-stream-ready').write
const fs = require('fs')
const path = require('path')
const { getFileName } = require('../util')

class UploaderController extends Controller {
  async index () {
    await this.ctx.render('upload')
  }

  async upload () {
    const ctx = this.ctx
    const stream = await ctx.getFileStream()
    try {
      const filename = getFileName() + path.extname(stream.filename)
      const filepath = path.resolve(__dirname, '../public/web', filename)
      const ws = fs.createWriteStream(filepath)
      await awaitWriteStream(stream.pipe(ws))
      ctx.ok({
        imgUrl: '/public/web/' + filename,
        fields: stream.fields,
        filename: stream.filename
      })
    } catch (err) {
      await sendToWormhole(stream)
      ctx.fail('上传失败')
    }
  }

  async oss () {
    const ctx = this.ctx
    const parts = ctx.multipart()
    const res = []
    let part
    while ((part = await parts()) != null) {
      if (part.length) {
        // arrays are busboy fields
        console.log('field: ' + part[0])
        console.log('value: ' + part[1])
        console.log('valueTruncated: ' + part[2])
        console.log('fieldnameTruncated: ' + part[3])
      } else {
        if (!part.filename) {
          // user click `upload` before choose a file,
          // `part` will be file stream, but `part.filename` is empty
          // must handler this, such as log error.
          return
        }
        // otherwise, it's a stream
        console.log('field: ' + part.fieldname)
        console.log('filename: ' + part.filename)
        console.log('encoding: ' + part.encoding)
        console.log('mime: ' + part.mime)
        let result
        try {
          result = await ctx.oss.put(
            'egg-multipart-test/' + part.filename,
            part
          )
        } catch (err) {
          await sendToWormhole(part)
          throw err
        }
        console.log(result)
        res.push(result)
      }
    }
    if (res.length) {
      this.ctx.ok({
        imgUrl: res
      })
    } else {
      this.ctx.fail('请选择文件')
    }
    console.log('and we are done parsing the form!')
  }
}

module.exports = UploaderController
