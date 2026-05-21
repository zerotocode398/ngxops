```shell
django-admin startproject core
python manage.py startapp apps/nginx
python manage.py startapp apps/auth
python manage.py startapp apps/config
python manage.py startapp apps/cmdb

python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```