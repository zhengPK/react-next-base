# 拉取代码到服务器之后执行
docker build -t react-next-base .
docker run -p 8000:3000 react-next-base 