async function refreshCDN() {
  const secretId = process.env.CDN_ID
  const secretKey = process.env.CDN_KEY
  const cdnDomain = 'icyfenix.cn'

  if (!secretId || !secretKey) {
    console.log('腾讯云 CDN 配置不完整，跳过刷新')
    return
  }

  try {
    const tencentcloud = await import('tencentcloud-sdk-nodejs-cdn')
    const CdnClient = tencentcloud.cdn.v20180606.Client

    const client = new CdnClient({
      credential: {
        secretId,
        secretKey
      },
      region: '',
      profile: {
        httpProfile: {
          endpoint: 'cdn.tencentcloudapi.com'
        }
      }
    })

    console.log(`正在刷新 CDN: https://${cdnDomain}/`)

    const paths = [
      `https://${cdnDomain}/`,
      `https://${cdnDomain}/assets/`
    ]

    const flushResult = await client.PurgePathCache({
      Paths: paths,
      FlushType: 'flush'
    })

    console.log('CDN 刷新任务已提交:')
    console.log(`  任务 ID: ${flushResult.TaskId}`)
    paths.forEach(p => console.log(`  - ${p}`))
  } catch (error) {
    console.error('CDN 刷新失败:', error.message)
    if (error.code) {
      console.error(`  错误码: ${error.code}`)
    }
  }
}

refreshCDN()
