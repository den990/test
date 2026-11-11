# Доставка мебели — лендинг

Одностраничный сайт для домена `dostavka-mebeli-bistro.ru`. Это статические файлы: nginx только отдаёт их, отдельной базы и backend нет.

Сервер `188.225.77.59` (Timeweb) с этой машины по SSH не открылся: порт 22 принимает соединение и сразу отвечает `Not allowed at this time`. Пока панель Timeweb не пустит SSH, файлы лежат локально. Ниже полный порядок выкладки, когда доступ появится.

Пароль root в эту инструкцию не записан. Тот, что уже был в переписке, лучше сменить.

## Что лежит в папке

| Файл | Зачем |
| --- | --- |
| `index.html` | Страница |
| `css/style.css` | Оформление |
| `js/main.js` | Меню, год в подвале, текст заявки |
| `favicon.svg` | Значок вкладки |
| `nginx/dostavka-mebeli-bistro.conf` | Сайт nginx на порту 80. Сертификат сюда дописывает certbot |
| `README.md` | Эта инструкция |

На сервер в каталог сайта копируются только `index.html`, `css`, `js` и `favicon.svg`. Конфиг nginx кладётся отдельно.

## Что заменить до запуска

Сейчас стоят заглушки. Найдите и замените их своими данными.

- Телефон `+7 (900) 000-00-00` и ссылка `tel:+79000000000` в `index.html`. Вхождения в шапке, в первом экране, в блоке заявки и в кнопке «Позвонить».
- Почта `zakaz@dostavka-mebeli-bistro.ru`: мета-тег `contact-email` в `index.html`. На неё открывается письмо из формы. Ящик должен реально существовать.
- Цены в блоке «Ориентир по цене» и пример «2 400 ₽» на карточке. Это выдуманные цифры для макета.
- Текст «По городу и области», если нужно название города.

Форма заявку на сервер не отправляет. Кнопка «Собрать заявку» показывает текст, копирует его и открывает письмо в почтовой программе посетителя. Так и задумано: на VPS нет скрипта приёма форм. Если заявки должны приходить сами, это уже отдельная доработка.

Проверка на своём компьютере: откройте `index.html` двойным щелчком. Меню, якоря и форма работают без сервера.

## 1. Домен

Сейчас имя смотрит не на этот VPS. На 11 ноября 2026 проверка через `8.8.8.8` давала:

- `A` → `31.31.197.40`
- `AAAA` → `2a00:f940:2:2:1:1:0:293`

Пока записи такие, посетители и Let's Encrypt попадут на чужой адрес. Сертификат не выпустится.

В панели регистратора домена:

1. Удалите старую `A`-запись и `AAAA`-запись, если у VPS нет этого IPv6.
2. Создайте `A` для `@` со значением `188.225.77.59`.
3. Создайте `A` для `www` с тем же IP.
4. Подождите, пока обновится DNS. У старой записи TTL был 3600 секунд, обычно хватает до часа, у регистратора иногда дольше.

Проверка в PowerShell:

```powershell
nslookup dostavka-mebeli-bistro.ru 8.8.8.8
nslookup www.dostavka-mebeli-bistro.ru 8.8.8.8
```

В ответе должен быть только `188.225.77.59`. Строки с `31.31.197.40` и с IPv6 быть не должно.

## 2. Доступ к VPS

Сервер на Timeweb, обратная зона `ns1.timeweb.ru`. Сообщение `Not allowed at this time` вместо баннера SSH значит, что машина выключена или панель режет SSH ещё до входа.

В панели Timeweb:

1. Откройте этот VPS и убедитесь, что он в состоянии «Запущен». Если выключен — включите и подождите минуту.
2. В файрволе разрешите входящие TCP `22`, `80` и `443`. Порт 22 нужен вам, 80 — для сайта и проверки Let's Encrypt, 443 — для HTTPS.
3. Если включён белый список SSH, добавьте свой текущий IP либо временно откройте 22 для всех.
4. Смените пароль root.

Проверка с компьютера, до всякого входа:

```powershell
python -c "import socket; s=socket.create_connection(('188.225.77.59',22),10); s.settimeout(8); print(s.recv(80)); s.close()"
```

Готовый сервер отвечает строкой вроде `SSH-2.0-OpenSSH_...`. Пока в ответе `Not allowed at this time`, команды ниже выполнять рано.

Вход:

```powershell
ssh root@188.225.77.59
```

Дальше команды выполняются уже на сервере, если не сказано иное. Инструкция для Ubuntu и Debian — так обычно ставят VPS Timeweb. Пакеты ставятся через `apt`.

## 3. Nginx

```bash
apt update
apt install -y nginx
mkdir -p /var/www/dostavka-mebeli-bistro
```

Если позже включите `ufw`, сначала откройте SSH, иначе можно потерять вход:

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

Файрвол в панели Timeweb при этом тоже должен пропускать 80 и 443. Это разные стены.

## 4. Залить файлы

На своём компьютере, из папки сайта. Пароль спросит `scp`.

```powershell
cd C:\Users\Daniil\Desktop\talk\dostavka-mebeli-bistro
scp index.html favicon.svg root@188.225.77.59:/var/www/dostavka-mebeli-bistro/
scp -r css js root@188.225.77.59:/var/www/dostavka-mebeli-bistro/
scp nginx\dostavka-mebeli-bistro.conf root@188.225.77.59:/etc/nginx/sites-available/dostavka-mebeli-bistro.conf
```

Снова на сервере:

```bash
chown -R www-data:www-data /var/www/dostavka-mebeli-bistro
find /var/www/dostavka-mebeli-bistro -type d -exec chmod 755 {} \;
find /var/www/dostavka-mebeli-bistro -type f -exec chmod 644 {} \;
ln -sf /etc/nginx/sites-available/dostavka-mebeli-bistro.conf /etc/nginx/sites-enabled/dostavka-mebeli-bistro.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl reload nginx
```

Если каталога `sites-available` нет, пакет nginx собран иначе. Тогда положите тот же файл в `/etc/nginx/conf.d/dostavka-mebeli-bistro.conf` и не делайте `ln`.

Проверка по IP, ещё без сертификата:

```bash
curl -I -H "Host: dostavka-mebeli-bistro.ru" http://127.0.0.1/
```

Ожидается `HTTP/1.1 200`. Снаружи, когда DNS уже указывает на VPS: `http://dostavka-mebeli-bistro.ru`.

## 5. Сертификат

Ставить сертификат только после того, как оба имени (`dostavka-mebeli-bistro.ru` и `www`) резолвятся в `188.225.77.59` и сайт открывается по HTTP. Иначе Let's Encrypt не увидит проверку и лимит попыток можно исчерпать.

На сервере:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d dostavka-mebeli-bistro.ru -d www.dostavka-mebeli-bistro.ru
```

Certbot спросит почту для уведомлений об истечении и согласие с условиями. Согласитесь с редиректом HTTP → HTTPS, когда спросит.

Он сам допишет порт 443 и пути сертификатов в конфиг nginx. Сертификаты появятся в `/etc/letsencrypt/live/dostavka-mebeli-bistro.ru/`.

Проверка продления:

```bash
systemctl status certbot.timer
certbot renew --dry-run
```

Таймер должен быть активен. `dry-run` должен закончиться без ошибки. Настоящее продление certbot делает сам, примерно за 30 дней до конца срока.

Сайт после этого: `https://dostavka-mebeli-bistro.ru`.

Если нужен один адрес без `www`, после успешного выпуска можно отдельно настроить редирект с `www` на голое имя. Для первого запуска это не обязательно: оба имени уже в сертификате.

## 6. Обновление страницы

После правок на компьютере снова залейте только изменившиеся файлы:

```powershell
cd C:\Users\Daniil\Desktop\talk\dostavka-mebeli-bistro
scp index.html favicon.svg root@188.225.77.59:/var/www/dostavka-mebeli-bistro/
scp -r css js root@188.225.77.59:/var/www/dostavka-mebeli-bistro/
```

Nginx перезагружать не нужно, если не менялся его конфиг. Обновите страницу с очисткой кэша: CSS и JS отдаются с кэшем на 7 дней.

## Если что-то не работает

**SSH снова пишет `Not allowed at this time`.** VPS выключен или файрвол Timeweb закрыл 22. Смотрите статус сервера в панели, а не конфиг nginx.

**`nginx -t` ругается на файл.** Не подключайте SSL-конфиг вручную до появления файлов в `/etc/letsencrypt/live/`. До сертификата используется только файл из `nginx/`.

**Certbot: connection refused или unauthorized.** Домен ещё смотрит на старый IP, закрыт порт 80, или снаружи открывается не этот nginx. Проверьте `nslookup` и `curl -I http://dostavka-mebeli-bistro.ru`.

**Certbot: too many requests.** Подождите, лимит Let's Encrypt временный. Ещё раз запускать вслепую не нужно.

**Сайт открывается по голому IP чужой страницей.** Так и будет, пока в `server_name` нет IP. Открывайте домен. Либо добавьте IP в `server_name`, если хотите видеть сайт и по адресу сервера.

**HTTPS открывается, а по HTTP нет редиректа.** Запустите certbot ещё раз и выберите редирект, либо проверьте, что в конфиге появился `return 301 https://...`.
