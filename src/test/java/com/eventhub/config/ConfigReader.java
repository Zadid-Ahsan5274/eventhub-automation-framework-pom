package com.eventhub.config;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

public final class ConfigReader {
    private static final Properties PROPS = new Properties();
    static{
        try(InputStream in = ConfigReader.class.getClassLoader().getResourceAsStream("config.properties")){
            if(in==null) {throw new IllegalStateException("Config properties not found on classpath");}
            PROPS.load(in);
        }catch(IOException e){
            throw new IllegalStateException("Unable to load config.properties",e);
        }

    }

    private ConfigReader(){}
    public static String get(String key){
        String sys = System.getProperty(key);
        if(sys!=null && !sys.isBlank()){
            return sys.trim();
        }
        String env = System.getenv(key.toUpperCase().replace('.','_'));
        if(env!=null && !env.isBlank()){
            return env.trim();
        }
        return PROPS.getProperty(key,"").trim();
    }

    public static int getInt(String key, int defaultValue){
        try{
            return Integer.parseInt(get(key));
        }
        catch(NumberFormatException e){
            return defaultValue;
        }
    }

    public static boolean getBoolean(String key, boolean defaultValue){
        String v = get(key);
        return v.isEmpty() ? defaultValue : Boolean.parseBoolean(v);
    }
}
