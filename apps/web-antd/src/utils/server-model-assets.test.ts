import { describe, expect, it } from 'vitest';

import {
  resolveServerAssetImage,
  resolveServerModelImage,
  resolveServerUPositionImage,
} from './server-model-assets';

describe('server model assets', () => {
  it('uses explicit database asset paths before static catalog matching', () => {
    expect(
      resolveServerModelImage({
        brandName: 'Dell',
        modelName: 'PowerEdge R740',
        model_image: '/assets/model/custom-model.png',
      }),
    ).toBe('/assets/model/custom-model.png');

    expect(
      resolveServerUPositionImage({
        brandName: 'Dell',
        modelName: 'PowerEdge R740',
        uPositionImage: '/assets/model/custom-u.png',
      }),
    ).toBe('/assets/model/custom-u.png');
  });

  it('resolves catalog assets by normalized brand and model names', () => {
    expect(
      resolveServerModelImage({
        manufacturer: 'Dell Inc.',
        model: 'PowerEdge R740',
      }),
    ).toBe('/assets/model/dell-poweredge-r740.png');

    expect(
      resolveServerUPositionImage({
        brandName: '华为',
        modelName: 'FusionServer 2288H V5',
      }),
    ).toBe('/assets/model/huawei-2288h-v5_u.png');

    expect(
      resolveServerModelImage({
        brandName: 'Huawei',
        modelName: 'FusionServer RH1288 V3',
      }),
    ).toBe('/assets/model/huawei-1288h-v3.png');

    expect(
      resolveServerUPositionImage({
        brandName: '华为',
        modelName: 'FusionServer 2488H V5',
      }),
    ).toBe('/assets/model/huawei-2488h-v5_u.png');

    expect(
      resolveServerUPositionImage({
        brandName: 'Huawei',
        modelName: 'TaiShan 2280 V2',
      }),
    ).toBe('/assets/model/huawei-taishan-2280-v2_u.png');

    expect(
      resolveServerModelImage({
        brandName: '华为',
        modelName: 'FusionServer 2288H V7',
      }),
    ).toBe('/assets/model/huawei-2288h-v7.png');

    expect(
      resolveServerUPositionImage({
        brandName: 'xFusion',
        modelName: 'FusionServer 2288H V7',
      }),
    ).toBe('/assets/model/xfusion-2288h-v7_u.png');

    expect(
      resolveServerUPositionImage({
        manufacturer: 'Dell Inc.',
        model: 'PowerEdge R640',
      }),
    ).toBe('/assets/model/dell-poweredge-r640_u.png');

    expect(
      resolveServerUPositionImage({
        brandName: 'THTF',
        modelName: 'Chaoqiang K620 series',
      }),
    ).toBe('/assets/model/thtf-chaoqiang-k620-series_u.png');

    expect(
      resolveServerUPositionImage({
        brandName: '浪潮',
        modelName: 'NF5180M5',
      }),
    ).toBe('/assets/model/inspur-nf5180m5_u.png');

    expect(
      resolveServerModelImage({
        brandName: '浪潮',
        modelName: 'NF5280M4',
      }),
    ).toBe('/assets/model/inspur-nf5280m4.png');

    expect(
      resolveServerUPositionImage({
        brandName: '浪潮',
        modelName: 'NF5466M5',
      }),
    ).toBe('/assets/model/inspur-nf5466m5_u.png');

    expect(
      resolveServerModelImage({
        brandName: '浪潮',
        modelName: 'NF8260M5',
      }),
    ).toBe('/assets/model/inspur-nf8260m5.png');

    expect(
      resolveServerModelImage({
        manufacturer: 'Dell Inc.',
        model: 'PowerEdge R940xa',
      }),
    ).toBe('/assets/model/dell-poweredge-r940xa.png');

    expect(
      resolveServerUPositionImage({
        manufacturer: 'Dell Inc.',
        model: 'PowerEdge R720xd',
      }),
    ).toBe('/assets/model/dell-poweredge-r720-xd_u.png');

    expect(
      resolveServerModelImage({
        brandName: 'Super Micro',
        modelName: 'SYS-7049GP-TRT',
      }),
    ).toBe('/assets/model/supermicro-sys-7049gp-trt.png');
  });

  it('does not pick a shorter sibling model when brand is missing', () => {
    expect(
      resolveServerModelImage({
        modelName: 'PowerEdge R740 XD',
      }),
    ).toBe('');
  });

  it('keeps model and U-position image resolution separate', () => {
    const server = {
      brandName: 'Dell',
      modelName: 'PowerEdge R750',
    };

    expect(resolveServerAssetImage(server, 'model')).toBe(
      '/assets/model/dell-poweredge-r750.png',
    );
    expect(resolveServerAssetImage(server, 'u')).toBe(
      '/assets/model/dell-poweredge-r750_u.png',
    );
  });
});
