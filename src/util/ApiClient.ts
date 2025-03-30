import ky, { Options } from "ky";
import { instanceToPlain, plainToInstance } from "class-transformer";

const apiClient = ky.create({
    prefixUrl: "http://localhost:9999/api", 
    headers: {
        "Content-Type": "application/json",
    },
});

export async function getDataVector<T extends object>(
    url: string,
    model: {
        new (...args: ConstructorParameters<typeof Object>): T;
    },
    options?: Options,
): Promise<T[]> {
    const response = await apiClient.get(url, options).json();
    return plainToInstance(model, response as object[]);
}

export async function getDataScalar<T extends object>(
    url: string,
    model: {
        new (...args: ConstructorParameters<typeof Object>): T;
    },
    options?: Options,
): Promise<T> {
    const response = await apiClient.get(url, options).json();
    return plainToInstance(model, response as object);
}

export async function postData<T extends object, R>(
    url: string,
    body: T,
    model: {
        new (...args: ConstructorParameters<typeof Object>): R;
    },
    options?: Options,
): Promise<R> {
    const serializedBody = instanceToPlain(body); 
    const response = await apiClient
        .post(url, { ...options, json: serializedBody })
        .json();
    return plainToInstance(model, response); 
}
