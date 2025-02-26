import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:crypto/crypto.dart';

class BlockmetricAnalytics {
  static BlockmetricAnalytics? _instance;
  final String apiKey;
  final String baseUrl;
  late String sessionId;
  late DateTime appStartTime;
  late String visitorId;
  Map<String, dynamic>? _deviceInfo;
  PackageInfo? _packageInfo;

  BlockmetricAnalytics._({required this.apiKey, String? baseUrl})
      : baseUrl = baseUrl ?? 'https://api.blockmetric.io' {
    sessionId = _generateSessionId();
    appStartTime = DateTime.now();
  }

  static Future<BlockmetricAnalytics> initialize({
    required String apiKey,
    String? baseUrl,
  }) async {
    if (_instance == null) {
      _instance = BlockmetricAnalytics._(apiKey: apiKey, baseUrl: baseUrl);
      await _instance!._initializeSDK();
    }
    return _instance!;
  }

  Future<void> _initializeSDK() async {
    await Future.wait([
      _initializeDeviceInfo(),
      _initializePackageInfo(),
    ]);
    visitorId = await getOrCreateVisitorId();
  }

  String _generateSessionId() {
    final random = DateTime.now().millisecondsSinceEpoch.toString();
    final hash = sha256.convert(utf8.encode(random)).toString();
    return hash.substring(0, 32);
  }

  Future<String> generateVisitorFingerprint() async {
    final components = [
      _deviceInfo?['platform'],
      _deviceInfo?['model'],
      _deviceInfo?['manufacturer'],
      _deviceInfo?['version'],
      _packageInfo?.packageName,
      _packageInfo?.version,
      _packageInfo?.buildNumber,
    ].where((element) => element != null).join('|');

    final hash = sha256.convert(utf8.encode(components)).toString();
    return hash;
  }

  Future<void> _initializeDeviceInfo() async {
    final deviceInfo = DeviceInfoPlugin();
    try {
      if (await deviceInfo.androidInfo != null) {
        final androidInfo = await deviceInfo.androidInfo;
        _deviceInfo = {
          'platform': 'android',
          'model': androidInfo.model,
          'manufacturer': androidInfo.manufacturer,
          'version': androidInfo.version.release,
        };
      } else if (await deviceInfo.iosInfo != null) {
        final iosInfo = await deviceInfo.iosInfo;
        _deviceInfo = {
          'platform': 'ios',
          'model': iosInfo.model,
          'version': iosInfo.systemVersion,
        };
      }
    } catch (e) {
      print('Error getting device info: $e');
    }
  }

  Future<void> _initializePackageInfo() async {
    try {
      _packageInfo = await PackageInfo.fromPlatform();
    } catch (e) {
      print('Error getting package info: $e');
    }
  }

  Future<String> getOrCreateVisitorId() async {
    final prefs = await SharedPreferences.getInstance();
    const storageKey = 'blockmetric_visitor_id';
    String? visitorId = prefs.getString(storageKey);

    if (visitorId == null) {
      visitorId = await generateVisitorFingerprint();
      await prefs.setString(storageKey, visitorId);
    }

    return visitorId;
  }

  Future<void> trackEvent(String eventName, [Map<String, dynamic>? properties]) async {
    final eventData = {
      'eventName': eventName,
      'timestamp': DateTime.now().toIso8601String(),
      'sessionId': sessionId,
      'visitorId': visitorId,
      'device': _deviceInfo,
      'app': {
        'packageName': _packageInfo?.packageName,
        'version': _packageInfo?.version,
        'buildNumber': _packageInfo?.buildNumber,
      },
      if (properties != null) ...properties,
    };

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/analytics/events'),
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
          'X-App-Identifier': _packageInfo?.packageName ?? '',
        },
        body: json.encode(eventData),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to track event: ${response.body}');
      }
    } catch (e) {
      print('Error tracking event: $e');
      // TODO: Implement offline event queue
    }
  }

  Future<void> trackScreenView(String screenName) async {
    await trackEvent('screen_view', {'screenName': screenName});
  }

  Future<void> trackAppStart() async {
    await trackEvent('app_start');
  }

  Future<void> trackAppExit() async {
    final exitTime = DateTime.now();
    final timeSpent = exitTime.difference(appStartTime).inMilliseconds;

    if (timeSpent >= 1000 && timeSpent <= 3600000) {
      await trackEvent('app_exit', {
        'timeSpent': timeSpent,
        'exitTime': exitTime.toIso8601String(),
      });
    }
  }
}