package com.eventhub.config;

public final class FrameworkConfig {
    private FrameworkConfig(){}
    public static String baseUrl(){
        String url = ConfigReader.get("base.url");
        return url.endsWith("/")?url.substring(0,url.length()-1):url;
    }

    public static String loginPath(){return ConfigReader.get("login.path");}
    public static String registerPath(){return ConfigReader.get("register.path");}
    public static String eventsPath(){return ConfigReader.get("events.path");}
    public static String bookingsPath(){return ConfigReader.get("bookings.path");}

    public static String browser(){return ConfigReader.get("browser").toLowerCase();}
    public static String channel(){return ConfigReader.get("browser.channel");}
    public static boolean headless(){return ConfigReader.getBoolean("headless",true);}
    public static int slowMo(){return ConfigReader.getInt("slow.mo",0);}
    public static int viewportWidth(){return ConfigReader.getInt("viewport.width",1440);}
    public static int viewportHeight(){return ConfigReader.getInt("viewport.height",900);}

    public static int defaultTimeout(){return ConfigReader.getInt("timeout.default",15000);}
    public static int navigationTimeout(){return ConfigReader.getInt("timeout.navigation",30000);}

    public static boolean tracingEnabled(){return !"off".equalsIgnoreCase(ConfigReader.get("tracing"));}
    public static boolean videoEnabled(){return ConfigReader.getBoolean("video",false);}
    public static int retryCount(){return ConfigReader.getInt("retry.count",0);}

    public static String testEmail(){return ConfigReader.get("test.email");}
    public static String testPassword(){return ConfigReader.get("test.password");}



}
