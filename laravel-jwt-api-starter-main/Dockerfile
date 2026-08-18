# Imagen base con Apache y PHP 8.2
FROM php:8.1-apache

# Instalar dependencias del sistema necesarias para Laravel y extensiones PHP comunes
RUN apt-get update && apt-get install -y \
    git \
    curl \
    vim \
    zip \
    unzip \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libpq-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libicu-dev \
    libssl-dev \
    libcurl4-openssl-dev \
    pkg-config \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo \
        pdo_mysql \
        pdo_pgsql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        intl \
        zip \
        opcache \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Instalar Composer globalmente
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Establecer el directorio de trabajo
WORKDIR /var/www/html

# Copiar el código de la aplicación (en desarrollo se suele usar un volumen)
COPY . .

# Instalar dependencias PHP
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

# Configurar permisos (necesario para logs y cache)  <<< Probar a eliminar esto
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]

# Habilitar el módulo de reescritura de Apache (necesario para rutas de Laravel)
RUN a2enmod rewrite

# Configurar el VirtualHost para Laravel
COPY default.conf /etc/apache2/sites-available/000-default.conf

# Actualizar configuración de Apache para apuntar a /public <<< probar a eliminar esto
# RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
#    && sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Exponer el puerto 80
EXPOSE 80

# Comando por defecto (Apache en primer plano)
# CMD ["apache2-foreground"]
