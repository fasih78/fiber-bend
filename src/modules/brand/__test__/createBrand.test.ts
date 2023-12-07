import { describe, it, vi, expect } from 'vitest';
import createServer from '../../../server';
import * as BrandService from '../brand.service';
import dotenv from 'dotenv';

describe('POST "/brand" route', () => {
  it('should call createBrand service', async () => {
    const brand = {
      id: 1,
      name: 'mock name',
    };

    const createBrandSpy = vi.spyOn(BrandService, 'createBrand');

    expect(createBrandSpy.getMockName()).toEqual('createBrand');

    createBrandSpy.mockResolvedValue(brand as any);

    dotenv.config();

    const server = await createServer();

    await server.ready();

    const payload = {
      id: 1,
      name: 'mock name',
    };

    const jwt = server.jwt.sign({
      email: 'admin@gmail.com',
      name: 'Admin',
    });

    const headers = {
      Authorization: `Bearer ${jwt}`,
    };

    const response = await server.inject({
      method: 'POST',
      url: '/brand',
      payload,
      headers,
    });

    expect(response.json()).toEqual(brand);

    expect(createBrandSpy).toHaveBeenCalledWith(payload);
  });
});
