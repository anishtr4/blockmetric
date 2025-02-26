import 'package:flutter/material.dart';
import 'package:blockmetric_flutter/blockmetric.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Blockmetric
  final analytics = await Blockmetric.initialize(
    apiKey: 'YOUR_API_KEY_HERE',
    apiUrl: 'YOUR_API_URL_HERE', // Optional
  );

  runApp(MyApp(analytics: analytics));
}

class MyApp extends StatelessWidget {
  final Blockmetric analytics;

  const MyApp({Key? key, required this.analytics}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Blockmetric Demo',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: MyHomePage(analytics: analytics),
    );
  }
}

class MyHomePage extends StatefulWidget {
  final Blockmetric analytics;

  const MyHomePage({Key? key, required this.analytics}) : super(key: key);

  @override
  _MyHomePageState createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  int _counter = 0;

  @override
  void initState() {
    super.initState();
    // Track screen view
    widget.analytics.trackScreenView('Home Screen');
  }

  void _incrementCounter() {
    setState(() {
      _counter++;
    });
    
    // Track user action
    widget.analytics.trackUserAction('increment_counter', {
      'counter_value': _counter,
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Blockmetric Demo'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            const Text(
              'You have pushed the button this many times:',
            ),
            Text(
              '$_counter',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _incrementCounter,
        tooltip: 'Increment',
        child: const Icon(Icons.add),
      ),
    );
  }
}