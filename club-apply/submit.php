<?php
/**
 * WTC ONE Club 申请表单接收端
 * 部署：放到 Exabytes 主机的 club-apply/ 目录下，与 club-apply.html 同级。
 * 流程：前端 POST 表单字段 → 本脚本转发到飞书群机器人 Webhook → 返回 JSON。
 *
 * 你只需改下面这一行，把飞书群机器人的 Webhook 地址填进去即可。
 * 在拿到 Webhook 之前，脚本会照常记录申请（写本地日志），只是不发飞书。
 */
$feishu_webhook = "https://open.feishu.cn/open-apis/bot/v2/hook/a40d3082-4062-4608-b5b7-9039fa5ec78f"; // ← 飞书群机器人 Webhook 地址

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// 预检请求直接放行
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["ok" => false, "error" => "method_not_allowed"]);
    exit;
}

// 取字段（兼容 form-urlencoded 与 JSON 两种提交）
$raw = file_get_contents("php://input");
$ct  = isset($_SERVER["CONTENT_TYPE"]) ? $_SERVER["CONTENT_TYPE"] : "";
if (stripos($ct, "application/json") !== false) {
    $post = json_decode($raw, true) ?: [];
} else {
    $post = $_POST;
    if (empty($post) && !empty($raw)) {
        parse_str($raw, $post);
    }
}

function clean($v, $max = 2000) {
    if (is_array($v)) {
        return array_map(function ($x) use ($max) { return mb_substr(trim($x), 0, $max); }, $v);
    }
    return mb_substr(trim((string) $v), 0, $max);
}

$name      = clean($post["name"] ?? "");
$company   = clean($post["company"] ?? "");
$title     = clean($post["title"] ?? "");
$email     = clean($post["email"] ?? "");
$phone     = clean($post["phone"] ?? "");
$referrer  = clean($post["referrer"] ?? "");
$interests = clean($post["interests"] ?? []);
if (!is_array($interests)) { $interests = $interests ? [$interests] : []; }
$goals     = clean($post["goals"] ?? "");
$submitted = date("Y-m-d H:i:s");
$source    = clean($post["source_page"] ?? "club-apply");

// 基本校验
if ($name === "" || $email === "" || $phone === "") {
    http_response_code(422);
    echo json_encode(["ok" => false, "error" => "missing_required"]);
    exit;
}

$interests_str = empty($interests) ? "（未选择）" : implode("、", $interests);

// 组装飞书文本消息
$text = "【WTC ONE Club 新申请】\n"
      . "姓名：$name\n"
      . "公司：$company\n"
      . "职位：$title\n"
      . "邮箱：$email\n"
      . "电话：$phone\n"
      . "推荐人/渠道：$referrer\n"
      . "感兴趣板块：$interests_str\n"
      . "目标简述：$goals\n"
      . "来源页：$source\n"
      . "提交时间：$submitted";

// 写本地日志（即使飞书没配也留底）
$log_line = "[" . $submitted . "] " . $name . " | " . $email . " | " . $phone . "\n";
@file_put_contents(__DIR__ . "/applications.log", $log_line, FILE_APPEND);

$feishu_sent = false;
if ($feishu_webhook !== "" && strpos($feishu_webhook, "FEISHU_WEBHOOK_HERE") === false) {
    $payload = json_encode([
        "msg_type" => "text",
        "content"  => ["text" => $text]
    ]);
    $ch = curl_init($feishu_webhook);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 8,
        CURLOPT_HTTPHEADER     => ["Content-Type: application/json"],
        CURLOPT_POSTFIELDS     => $payload
    ]);
    $resp = curl_exec($ch);
    $err  = curl_error($ch);
    curl_close($ch);
    if ($resp !== false && strpos($resp, '"code":0') !== false) {
        $feishu_sent = true;
    }
}

echo json_encode([
    "ok"           => true,
    "feishu_sent"  => $feishu_sent,
    "message"      => $feishu_sent ? "received_and_notified" : "received_logged_only"
]);
exit;
