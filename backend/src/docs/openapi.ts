type Schema = Record<string, unknown>;
type ApiParameter = {
    name: string;
    in: 'path' | 'query';
    required?: boolean;
    schema: Schema;
    description?: string;
};
type EndpointOptions = {
    tag: 'Auth' | 'Users' | 'Cars' | 'Rentals';
    summary: string;
    description?: string;
    security?: 'cookieAuth' | 'refreshCookie';
    parameters?: ApiParameter[];
    body?: Schema;
    response?: Schema;
    status?: 200 | 201 | 204;
    errors?: number[];
};

const str = { type: 'string' };
const int = { type: 'integer' };
const positiveId = { type: 'integer', minimum: 1 };
const date = { type: 'string', format: 'date' };
const schemaRef = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const arrayOf = (items: Schema) => ({ type: 'array', items });
const objectOf = (properties: Record<string, unknown>, required?: string[]) => ({
    type: 'object',
    properties,
    ...(required ? { required } : {})
});
const body = (schema: Schema) => ({
    required: true,
    content: { 'application/json': { schema } }
});
const query = (name: string, schema: Schema, description?: string): ApiParameter => ({
    name, in: 'query', schema, ...(description ? { description } : {})
});
const idParameter: ApiParameter = {
    name: 'id', in: 'path', required: true, schema: positiveId,
    description: 'Числовой идентификатор'
};
const errorDescription: Record<number, string> = {
    400: 'Некорректные данные или параметры запроса',
    401: 'Авторизация отсутствует или недействительна',
    403: 'Недостаточно прав',
    404: 'Ресурс не найден',
    409: 'Конфликт данных или недопустимое действие'
};

function endpoint({
    tag, summary, description, security, parameters, body: requestSchema,
    response: responseSchema, status = 200, errors = []
}: EndpointOptions) {
    const responses: Record<string, unknown> = {
        [status]: {
            description: status === 204 ? 'Успешно, без тела ответа' : 'Успешный ответ',
            ...(responseSchema ? { content: { 'application/json': { schema: responseSchema } } } : {})
        }
    };
    for (const code of errors) {
        responses[code] = {
            description: errorDescription[code] ?? 'Ошибка запроса',
            content: { 'application/json': { schema: schemaRef('ApiError') } }
        };
    }
    return {
        tags: [tag], summary,
        ...(description ? { description } : {}),
        ...(security ? { security: [{ [security]: [] }] } : {}),
        ...(parameters ? { parameters } : {}),
        ...(requestSchema ? { requestBody: body(requestSchema) } : {}),
        responses
    };
}

const carProperties = {
    license_plate: str,
    brand: str,
    model: str,
    year: int,
    body_type_id: positiveId,
    drive_type_id: positiveId,
    rental_class_id: positiveId,
    transmission_id: positiveId,
    fuel_type_id: positiveId,
    seats: { type: 'integer', minimum: 2, maximum: 9 },
    doors: { type: 'integer', minimum: 2, maximum: 6 },
    price_per_day: { type: 'integer', minimum: 1 },
    status: str,
    image_url: str,
    description: str
};
const carFieldsRequired = [
    'license_plate', 'brand', 'model', 'year', 'body_type_id', 'drive_type_id',
    'rental_class_id', 'transmission_id', 'fuel_type_id', 'seats', 'doors',
    'price_per_day', 'status'
];
const rentalFields = {
    user_id: positiveId,
    car_id: positiveId,
    start_date: date,
    end_date: date,
    total_price: { type: 'integer', minimum: 0 }
};

const rentalQueryParameters = [
    query('rental_id', positiveId, 'ID аренды'),
    query('car_id', positiveId, 'ID автомобиля'),
    query('status', {
        type: 'string',
        example: 'pending,confirmed'
    }, 'Один или несколько статусов через запятую'),
    query('date_from', date, 'Начало периода поиска'),
    query('date_to', date, 'Конец периода поиска'),
    query('search', {
        type: 'string',
        minLength: 1,
        maxLength: 100
    }, 'Поиск по автомобилю, пользователю и ID аренды'),
    query('limit', {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 50
    }),
    query('offset', {
        type: 'integer',
        minimum: 0,
        default: 0
    })
];

const carQueryParameters = [
    query('car_id', positiveId),
    query('brand', str),
    query('model', str),
    query('year', positiveId),
    query('status', str),
    query('body_type_id', positiveId),
    query('drive_type_id', positiveId),
    query('rental_class_id', positiveId),
    query('transmission_id', positiveId),
    query('fuel_type_id', positiveId),
    query('seats', {
        type: 'integer', minimum: 2, maximum: 9
    }),
    query('doors', {
        type: 'integer', minimum: 2, maximum: 6
    }),
    query('search', {
        type: 'string', minLength: 1, maxLength: 100
    }, 'Поиск по марке, модели, госномеру, году и ID'),
    query('date_from', date, 'Дата начала аренды'),
    query('date_to', date, 'Дата окончания аренды'),
    query('limit', {
        type: 'integer', minimum: 1, maximum: 100, default: 20
    }),
    query('offset', {
        type: 'integer', minimum: 0, default: 0
    })
];

export const openapiDocument = {
    openapi: '3.0.3',
    info: {
        title: 'Car Rental API',
        version: '1.0.0',
        description: 'Документация backend системы аренды автомобилей. Аутентификация реализована через HTTP-only cookies.'
    },
    servers: [{ url: '/' }],
    tags: [
        { name: 'Auth', description: 'Регистрация, вход и управление токенами' },
        { name: 'Users', description: 'Профили пользователей и администрирование' },
        { name: 'Cars', description: 'Каталог и управление автомобилями' },
        { name: 'Rentals', description: 'Заявки, оплата и управление арендой' }
    ],
    components: {
        securitySchemes: {
            cookieAuth: { type: 'apiKey', in: 'cookie', name: 'access_token' },
            refreshCookie: { type: 'apiKey', in: 'cookie', name: 'refresh_token' }
        },
        schemas: {
            ApiError: objectOf({ error: str, details: arrayOf({ type: 'object', additionalProperties: true }) }, ['error']),
            UserCreate: objectOf({
                name: { type: 'string', minLength: 1 },
                surname: { type: 'string', minLength: 1 },
                email: { type: 'string', format: 'email' },
                phone: { type: 'string', minLength: 1 },
                password: { type: 'string', format: 'password', minLength: 8 }
            }, ['name', 'surname', 'email', 'phone', 'password']),
            UserUpdate: objectOf({
                name: { type: 'string', minLength: 1 },
                surname: { type: 'string', minLength: 1 },
                email: { type: 'string', format: 'email' },
                phone: { type: 'string', minLength: 1 }
            }),
            User: objectOf({
                user_id: positiveId, role: str,
                name: str, surname: str,
                email: { type: 'string', format: 'email' },
                phone: str,
                created_at: { type: 'string', format: 'date-time' },
                blocked_at: { type: 'string', nullable: true, format: 'date-time' }
            }, ['user_id', 'name', 'surname', 'email', 'phone']),
            UserList: objectOf({
                items: arrayOf(schemaRef('User')),
                pagination: objectOf({
                    total: int,
                    limit: int,
                    offset: int,
                    has_more: { type: 'boolean' }
                }, ['total', 'limit', 'offset', 'has_more'])
            }, ['items', 'pagination']),
            Login: objectOf({
                email: { type: 'string', format: 'email' },
                password: { type: 'string', format: 'password', minLength: 8 }
            }, ['email', 'password']),
            PasswordChange: objectOf({
                currentPassword: { type: 'string', format: 'password', minLength: 8 },
                newPassword: { type: 'string', format: 'password', minLength: 8 }
            }, ['currentPassword', 'newPassword']),
            CarCreate: objectOf(carProperties, carFieldsRequired),
            CarUpdate: objectOf(carProperties),
            Car: objectOf({
                car_id: positiveId,
                ...carProperties,
                deleted_at: { type: 'string', format: 'date-time', nullable: true },
                body_type_name: str, drive_type_name: str, rental_class_name: str,
                transmission_name: str, fuel_type_name: str
            }, ['car_id', 'license_plate', 'brand', 'model', 'year']),
            CarList: objectOf({
                items: arrayOf(schemaRef('Car')),
                pagination: objectOf({
                    total: int,
                    limit: int,
                    offset: int,
                    has_more: { type: 'boolean' }
                }, ['total', 'limit', 'offset', 'has_more'])
            }, ['items', 'pagination']),
            CarAttributes: objectOf({
                body_types: arrayOf({ type: 'object', additionalProperties: true }),
                drive_types: arrayOf({ type: 'object', additionalProperties: true }),
                rental_classes: arrayOf({ type: 'object', additionalProperties: true }),
                transmissions: arrayOf({ type: 'object', additionalProperties: true }),
                fuel_types: arrayOf({ type: 'object', additionalProperties: true })
            }),
            RentalCreate: objectOf({
                car_id: positiveId, start_date: date, end_date: date
            }, ['car_id', 'start_date', 'end_date']),
            RentalUpdate: objectOf(rentalFields),
            Rental: objectOf({
                rental_id: positiveId,
                ...rentalFields,
                status_id: positiveId,
                status_code: str,
                status_name: str,
                hold_expires_at: { type: 'string', nullable: true, format: 'date-time' },
                created_at: { type: 'string', format: 'date-time' },
                user: { type: 'object', additionalProperties: true },
                car: { type: 'object', additionalProperties: true }
            }, ['rental_id']),
            RentalStatusResult: objectOf({
                ok: { type: 'boolean', example: true },
                rental: schemaRef('Rental')
            }, ['ok', 'rental']),
            RentalList: objectOf({
                items: arrayOf(schemaRef('Rental')),
                pagination: objectOf({
                    total: int, limit: int, offset: int, has_more: { type: 'boolean' }
                })
            })
        }
    },
    paths: {
        '/auth/registration': {
            post: endpoint({
                tag: 'Auth', summary: 'Регистрация пользователя', body: schemaRef('UserCreate'),
                response: schemaRef('User'), status: 201, errors: [400, 409]
            })
        },
        '/auth/login': {
            post: endpoint({
                tag: 'Auth', summary: 'Вход по email и паролю', body: schemaRef('Login'),
                response: schemaRef('User'),
                description: 'Устанавливает httpOnly cookies access_token и refresh_token.',
                errors: [400, 401]
            })
        },
        '/auth/me': {
            get: endpoint({
                tag: 'Auth', summary: 'Данные текущего пользователя', security: 'cookieAuth',
                response: schemaRef('User'), errors: [401, 404]
            })
        },
        '/auth/refresh': {
            post: endpoint({
                tag: 'Auth', summary: 'Ротация токенов', security: 'refreshCookie',
                description: 'При успешном ответе 204 заменяются обе httpOnly cookies.',
                status: 204, errors: [401]
            })
        },
        '/auth/logout': {
            post: endpoint({
                tag: 'Auth', summary: 'Выход и отзыв refresh-сессии',
                description: 'Выполняет выход с помощью cookie refresh_token. Без неё тоже возвращает 204.',
                status: 204, errors: [401]
            })
        },
        '/users': {
            get: endpoint({
                tag: 'Users',
                summary: 'Список пользователей с фильтрацией и пагинацией (admin)',
                description: 'Возвращает пользователя независимо от состояния блокировки.',
                security: 'cookieAuth',
                parameters: [
                    query('user_id', positiveId, 'ID пользователя'),
                    query('role', {
                        type: 'string',
                        enum: ['client', 'manager', 'admin']
                    }, 'Роль пользователя'),
                    query('blocked', {
                        type: 'boolean'
                    }, 'Состояние блокировки'),
                    query('search', {
                        type: 'string',
                        minLength: 1,
                        maxLength: 100
                    }, 'Поиск по имени, фамилии, email, телефону и ID'),
                    query('limit', {
                        type: 'integer',
                        minimum: 1,
                        maximum: 100,
                        default: 50
                    }),
                    query('offset', {
                        type: 'integer',
                        minimum: 0,
                        default: 0
                    })
                ],
                response: schemaRef('UserList'),
                errors: [400, 401, 403]
            }),
            post: endpoint({
                tag: 'Users', summary: 'Создание пользователя (admin)', security: 'cookieAuth',
                body: schemaRef('UserCreate'), response: schemaRef('User'),
                status: 201, errors: [400, 401, 403, 409]
            })
        },
        '/users/{id}': {
            get: endpoint({
                tag: 'Users', summary: 'Пользователь по ID (admin)', security: 'cookieAuth',
                parameters: [idParameter], response: schemaRef('User'), errors: [400, 401, 403, 404]
            }),
            patch: endpoint({
                tag: 'Users', summary: 'Обновить свой профиль', security: 'cookieAuth',
                description: 'Проверяется право изменения собственного профиля (selfCheck).',
                parameters: [idParameter], body: schemaRef('UserUpdate'),
                response: schemaRef('User'), errors: [400, 401, 403, 404]
            })
        },
        '/users/{id}/admin': {
            patch: endpoint({
                tag: 'Users', summary: 'Обновить пользователя (admin)', security: 'cookieAuth',
                parameters: [idParameter], body: schemaRef('UserUpdate'),
                response: schemaRef('User'), errors: [400, 401, 403, 404]
            })
        },
        '/users/{id}/block': {
            patch: endpoint({
                tag: 'Users', summary: 'Заблокировать пользователя (admin)', security: 'cookieAuth',
                parameters: [idParameter], response: schemaRef('User'), errors: [400, 401, 403, 404]
            })
        },
        '/users/{id}/unblock': {
            patch: endpoint({
                tag: 'Users', summary: 'Разблокировать пользователя (admin)', security: 'cookieAuth',
                parameters: [idParameter], response: schemaRef('User'), errors: [400, 401, 403, 404]
            })
        },
        '/users/{id}/password': {
            patch: endpoint({
                tag: 'Users', summary: 'Сменить собственный пароль', security: 'cookieAuth',
                parameters: [idParameter], body: schemaRef('PasswordChange'),
                description: 'При успехе cookies очищаются.', status: 204,
                errors: [400, 401, 403, 404]
            })
        },
        '/cars': {
            get: endpoint({
                tag: 'Cars',
                summary: 'Каталог автомобилей',
                description: 'Возвращает только неудалённые автомобили. При передаче date_from и date_to возвращает автомобили, доступные на весь указанный период с учётом буфера между арендами.',
                parameters: carQueryParameters,
                response: schemaRef('CarList'),
                errors: [400]
            }),
            post: endpoint({
                tag: 'Cars', summary: 'Добавить автомобиль (manager/admin)', security: 'cookieAuth',
                body: schemaRef('CarCreate'), response: schemaRef('Car'), status: 201,
                errors: [400, 401, 403]
            })
        },
        '/cars/car-attributes': {
            get: endpoint({
                tag: 'Cars', summary: 'Справочники атрибутов автомобиля',
                response: schemaRef('CarAttributes')
            })
        },
        '/cars/temporaryAllCars': {
            get: endpoint({
                tag: 'Cars', summary: 'Все автомобили, включая удалённые (admin, временный маршрут)',
                security: 'cookieAuth', response: arrayOf(schemaRef('Car')), errors: [401, 403]
            })
        },
        '/cars/{id}': {
            get: endpoint({
                tag: 'Cars', summary: 'Автомобиль по ID', parameters: [idParameter],
                response: schemaRef('Car'), errors: [400, 404]
            }),
            patch: endpoint({
                tag: 'Cars', summary: 'Изменить автомобиль (manager/admin)', security: 'cookieAuth',
                parameters: [idParameter], body: schemaRef('CarUpdate'),
                response: schemaRef('Car'), errors: [400, 401, 403, 404]
            }),
            delete: endpoint({
                tag: 'Cars', summary: 'Мягкое удаление автомобиля (admin)', security: 'cookieAuth',
                parameters: [idParameter], response: schemaRef('Car'), errors: [400, 401, 403, 404]
            })
        },
        '/cars/{id}/restore': {
            patch: endpoint({
                tag: 'Cars', summary: 'Восстановить удалённый автомобиль (admin)', security: 'cookieAuth',
                parameters: [idParameter], response: schemaRef('Car'), errors: [400, 401, 403, 404]
            })
        },
        '/cars/{id}/availability': {
            get: endpoint({
                tag: 'Cars', summary: 'Недоступные периоды автомобиля', parameters: [idParameter],
                response: objectOf({
                    car_id: positiveId,
                    unavailable_periods: arrayOf(objectOf({ start_date: date, end_date: date }))
                }, ['car_id', 'unavailable_periods']), errors: [400, 404]
            })
        },
        '/cars/admin': {
            get: endpoint({
                tag: 'Cars',
                summary: 'Управление автопарком (admin)',
                description: 'Возвращает все автомобили, включая удалённые.',
                security: 'cookieAuth',
                parameters: [
                    ...carQueryParameters,
                    query('deleted', {
                        type: 'boolean'
                    }, 'true — удалённые, false — неудалённые, без параметра — все')
                ],
                response: schemaRef('CarList'),
                errors: [400, 401, 403]
            })
        },
        '/cars/{id}/admin': {
            get: endpoint({
                tag: 'Cars',
                summary: 'Автомобиль по ID (admin)',
                description: 'Позволяет получать в том числе удалённые автомобили.',
                security: 'cookieAuth',
                parameters: [idParameter],
                response: schemaRef('Car'),
                errors: [400, 401, 403, 404]
            })
        },
        '/rentals': {
            get: endpoint({
                tag: 'Rentals',
                summary: 'Все аренды с фильтрацией и пагинацией (manager/admin)',
                description: 'Фильтрация по датам учитывает пересечение периодов аренды. Сортировка по убыванию ID.',
                security: 'cookieAuth',
                parameters: [
                    ...rentalQueryParameters,
                    query('user_id', positiveId, 'ID пользователя')
                ],
                response: schemaRef('RentalList'),
                errors: [400, 401, 403]
            }),
            post: endpoint({
                tag: 'Rentals', summary: 'Создать заявку на аренду', security: 'cookieAuth',
                body: schemaRef('RentalCreate'), response: schemaRef('Rental'), status: 201,
                description: 'Начальный статус pending_payment. Даты включительны, между арендами нужен буфер 1 день.',
                errors: [400, 401, 404, 409]
            })
        },
        '/rentals/my': {
            get: endpoint({
                tag: 'Rentals',
                summary: 'Мои аренды с фильтрацией и пагинацией',
                description: 'Возвращает только аренды авторизованного пользователя. Переданный user_id игнорируется.',
                security: 'cookieAuth',
                parameters: rentalQueryParameters,
                response: schemaRef('RentalList'),
                errors: [400, 401]
            })
        },
        '/rentals/{id}': {
            get: endpoint({
                tag: 'Rentals', summary: 'Аренда по ID', security: 'cookieAuth',
                description: 'Клиент видит только свою аренду; manager/admin могут смотреть чужие.',
                parameters: [idParameter], response: schemaRef('Rental'), errors: [400, 401, 404]
            })
        },
        '/rentals/{id}/mock-payment': {
            post: endpoint({
                tag: 'Rentals', summary: 'Подтвердить тестовую оплату (admin)', security: 'cookieAuth',
                description: 'Временная операция: pending_payment → pending, если удержание ещё действует.',
                parameters: [idParameter], response: schemaRef('Rental'),
                errors: [400, 401, 403, 404, 409]
            })
        },
        '/rentals/{id}/confirm': {
            patch: endpoint({
                tag: 'Rentals', summary: 'Одобрить аренду (manager/admin)', security: 'cookieAuth',
                description: 'pending → confirmed', parameters: [idParameter],
                response: schemaRef('RentalStatusResult'), errors: [400, 401, 403, 404, 409]
            })
        },
        '/rentals/{id}/reject': {
            patch: endpoint({
                tag: 'Rentals', summary: 'Отклонить аренду (manager/admin)', security: 'cookieAuth',
                description: 'pending/confirmed → rejected', parameters: [idParameter],
                response: schemaRef('RentalStatusResult'), errors: [400, 401, 403, 404, 409]
            })
        },
        '/rentals/{id}/activate': {
            patch: endpoint({
                tag: 'Rentals', summary: 'Выдать автомобиль (manager/admin)', security: 'cookieAuth',
                description: 'confirmed → active', parameters: [idParameter],
                response: schemaRef('RentalStatusResult'), errors: [400, 401, 403, 404, 409]
            })
        },
        '/rentals/{id}/complete': {
            patch: endpoint({
                tag: 'Rentals', summary: 'Завершить аренду (manager/admin)', security: 'cookieAuth',
                description: 'active → completed', parameters: [idParameter],
                response: schemaRef('RentalStatusResult'), errors: [400, 401, 403, 404, 409]
            })
        },
        '/rentals/{id}/cancel': {
            patch: endpoint({
                tag: 'Rentals', summary: 'Отменить аренду (manager/admin)', security: 'cookieAuth',
                description: 'pending_payment/pending/confirmed/active → cancelled',
                parameters: [idParameter], response: schemaRef('RentalStatusResult'),
                errors: [400, 401, 403, 404, 409]
            })
        },
        '/rentals/{id}/admin': {
            patch: endpoint({
                tag: 'Rentals', summary: 'Редактировать аренду (admin)', security: 'cookieAuth',
                parameters: [idParameter], body: schemaRef('RentalUpdate'),
                response: schemaRef('RentalStatusResult'), errors: [400, 401, 403, 404, 409]
            })
        },
        '/rentals/{id}/manager': {
            patch: endpoint({
                tag: 'Rentals', summary: 'Редактировать аренду (manager/admin)', security: 'cookieAuth',
                description: 'Редактирование разрешено только для некоторых статусов и неистёкших периодов.',
                parameters: [idParameter], body: schemaRef('RentalUpdate'),
                response: schemaRef('RentalStatusResult'), errors: [400, 401, 403, 404, 409]
            })
        }
    }
};
