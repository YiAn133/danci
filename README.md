# danci
next.js 单词后台管理系统和 h5应用开发

## 应用形式
- 后台管理系统
- h5应用
- 多端开发

## 亮点
- 数据清洗
gitHub 高星的 单词资料库
要进行数据清洗（选择,格式化，审核）
- supabase 云端类的psql数据库
    关系型数据库
    支持向量数据库
    远端BASS（Backend as a service） 数据库
- ORM
    不用写sql，不用做数据库的底层处理
    含义：对象关系映射
## 后台管理系统
## 单词书管理
维护单词书，包含单词书的创建，删除，更新，查询等操作。
### 管理员管理
- 注册一个超级管理员

## shadcd/ui UI组件库
- 80%前端组件业务趋同，不同自己重复造轮子
    tailwindcss配合使用

## supabase
BASS 数据库云服务
- psql + embeeding + 关系数据库


## ORM

- 数据库supabase 已经云端创建

## Supabase 提供 TS/JS SDK，开发者不用手写 SQL，直接调用 JS 方法操作 Postgres 数据库。

.env  DATABASE_URL
- drizzle 接手数据库

### 数据清洗
- 常见的后端功能
scripts/
    解决一些问题 爬虫，数据格式转换等
能否给ai做？
上下文过大，超出上下文窗口，token开销过大
解决方法：ai生成一个script脚本，本地运行





## 流程
Supabase 是托管在云端的 PostgreSQL 数据库服务；Drizzle 是 TS 的 ORM 库，在你的后端代码里，用 TS 语法写查询，自动生成 SQL，来操作 Supabase 里的 PostgreSQL。


## drizzle
ORM 工具的一种，一系列的包和命令
- db目录
    - index.ts数据库配置
    - schema.ts 表的创建操作等

## words表
gitHub 下载 zip -> json文件(178kb)
    想创建一个words表，导入这个数据，但是由于内存过大，我们会超出上下文，于是让ai把它转为csv格式 让ai写一段格式转换脚本，本地运行

- RLS
    行安全 words 公共表没有必要开启
    而 每个用户的背单词记录 需要开启
- prompt执行上下文考虑
    1. 给prompt 提供充足的上下文
    数据表，技术架构，放在Agents.md文件
    2. 隐藏上下文开销，不让AI去读文件，给它要读取文件的示例，就好，这样AI就不会把文件读完
### 让AI了解Supabase 有books表
- 本地建schema
- 后台图书业务